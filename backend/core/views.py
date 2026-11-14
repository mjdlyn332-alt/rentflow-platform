from decimal import Decimal
from django.contrib.auth import authenticate
from django.db import transaction
from django.db.models import Sum, Count, Q
from django.http import JsonResponse
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from .models import Property, Unit, Party, Agreement, Installment, Service, MeterReading, ServiceBill, Cashbox, Voucher, MaintenanceTicket, Notification, AuditEvent
from .permissions import OrganizationRequired, CanCollect
from .serializers import UserSerializer, PropertySerializer, UnitSerializer, PartySerializer, AgreementSerializer, InstallmentSerializer, ServiceSerializer, MeterReadingSerializer, ServiceBillSerializer, CashboxSerializer, VoucherSerializer, MaintenanceSerializer, NotificationSerializer, OrganizationSerializer

class OrgViewSet(viewsets.ModelViewSet):
    permission_classes = [OrganizationRequired]
    def get_queryset(self): return self.queryset.filter(organization=self.request.user.organization)
    def perform_create(self, serializer): serializer.save(organization=self.request.user.organization)

class PropertyViewSet(OrgViewSet):
    queryset = Property.objects.all().select_related("owner").prefetch_related("units")
    serializer_class = PropertySerializer

class UnitViewSet(OrgViewSet):
    queryset = Unit.objects.all().select_related("property")
    serializer_class = UnitSerializer
    def get_queryset(self):
        qs = super().get_queryset()
        property_id = self.request.query_params.get("property")
        return qs.filter(property_id=property_id) if property_id else qs

class PartyViewSet(OrgViewSet):
    queryset = Party.objects.all()
    serializer_class = PartySerializer

class AgreementViewSet(OrgViewSet):
    queryset = Agreement.objects.all().select_related("unit__property", "tenant").prefetch_related("installments")
    serializer_class = AgreementSerializer
    def get_queryset(self):
        qs = super().get_queryset()
        if self.request.user.role == "RENTER": qs = qs.filter(tenant__user=self.request.user)
        return qs

class InstallmentViewSet(OrgViewSet):
    queryset = Installment.objects.all().select_related("agreement")
    serializer_class = InstallmentSerializer

class ServiceViewSet(OrgViewSet):
    queryset = Service.objects.all().select_related("unit")
    serializer_class = ServiceSerializer

class MeterReadingViewSet(OrgViewSet):
    queryset = MeterReading.objects.all().select_related("service", "recorded_by")
    serializer_class = MeterReadingSerializer
    http_method_names = ["get", "post", "head", "options"]

class ServiceBillViewSet(OrgViewSet):
    queryset = ServiceBill.objects.all().select_related("service")
    serializer_class = ServiceBillSerializer

class CashboxViewSet(OrgViewSet):
    queryset = Cashbox.objects.all()
    serializer_class = CashboxSerializer
    http_method_names = ["get", "head", "options"]

class VoucherViewSet(OrgViewSet):
    queryset = Voucher.objects.all().select_related("cashbox", "posted_by")
    serializer_class = VoucherSerializer
    permission_classes = [OrganizationRequired, CanCollect]
    def create(self, request, *args, **kwargs):
        incoming_key = request.data.get("idempotency_key")
        if incoming_key:
            existing = self.get_queryset().filter(idempotency_key=incoming_key).first()
            if existing:
                return Response(self.get_serializer(existing).data, status=status.HTTP_200_OK)
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        key = serializer.validated_data["idempotency_key"]
        with transaction.atomic():
            existing = Voucher.objects.select_for_update().filter(idempotency_key=key).first()
            if existing: return Response(self.get_serializer(existing).data, status=status.HTTP_200_OK)
            cashbox = Cashbox.objects.select_for_update().get(id=serializer.validated_data["cashbox"].id, organization=request.user.organization, is_active=True)
            voucher = serializer.save(organization=request.user.organization, posted_by=request.user, number=f"RV-{timezone.now():%Y%m%d%H%M%S}")
            cashbox.balance = cashbox.balance + voucher.amount
            cashbox.save(update_fields=["balance", "updated_at"])
            AuditEvent.objects.create(organization=request.user.organization, actor=request.user, action="voucher.post", entity="Voucher", entity_id=str(voucher.id), metadata={"amount": str(voucher.amount), "kind": voucher.kind})
        return Response(self.get_serializer(voucher).data, status=status.HTTP_201_CREATED)
    def update(self, request, *args, **kwargs): return Response({"detail": "المستند المرحّل لا يعدل؛ استخدم عملية عكس موثقة."}, status=405)
    def destroy(self, request, *args, **kwargs): return Response({"detail": "المستند المرحّل لا يحذف."}, status=405)

class MaintenanceViewSet(OrgViewSet):
    queryset = MaintenanceTicket.objects.all().select_related("unit", "reported_by")
    serializer_class = MaintenanceSerializer
    def perform_create(self, serializer): serializer.save(organization=self.request.user.organization, reported_by=self.request.user)

class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [OrganizationRequired]
    def get_queryset(self): return Notification.objects.filter(organization=self.request.user.organization, user=self.request.user).order_by("-created_at")

class HealthView(APIView):
    permission_classes = []
    def get(self, request): return JsonResponse({"ok": True, "service": "rentflow-api"})

class LoginView(APIView):
    permission_classes = []
    def post(self, request):
        user = authenticate(username=request.data.get("username"), password=request.data.get("password"))
        if not user or not user.is_active or not user.organization_id or not user.organization.is_active: return Response({"detail": "بيانات الدخول أو حالة المنشأة غير صالحة."}, status=401)
        refresh = RefreshToken.for_user(user)
        refresh["org"] = str(user.organization_id); refresh["role"] = user.role; refresh["token_version"] = user.token_version
        return Response({"access": str(refresh.access_token), "refresh": str(refresh), "user": UserSerializer(user).data})

class MeView(APIView):
    permission_classes = [OrganizationRequired]
    def get(self, request): return Response(UserSerializer(request.user).data)

class DashboardView(APIView):
    permission_classes = [OrganizationRequired]
    def get(self, request):
        org = request.user.organization
        agreements = Agreement.objects.filter(organization=org).select_related("unit__property", "tenant").prefetch_related("installments")
        if request.user.role == "RENTER": agreements = agreements.filter(tenant__user=request.user)
        properties = Property.objects.filter(organization=org).prefetch_related("units")
        notifications = Notification.objects.filter(organization=org, user=request.user).order_by("-created_at")[:10]
        installments = Installment.objects.filter(organization=org)
        return Response({"organization": OrganizationSerializer(org).data, "role": request.user.role, "currency": org.currency, "metrics": {"rent_due": str(installments.filter(status__in=["DUE", "PARTIAL"]).aggregate(v=Sum("amount"))["v"] or Decimal("0")), "properties": properties.count(), "units": Unit.objects.filter(organization=org).count(), "occupied": Unit.objects.filter(organization=org, status="RENTED").count()}, "agreements": AgreementSerializer(agreements[:20], many=True).data, "properties": PropertySerializer(properties[:20], many=True).data, "notifications": NotificationSerializer(notifications, many=True).data})
