from rest_framework import serializers
from .models import Organization, User, Property, Unit, Party, Agreement, Installment, Service, MeterReading, ServiceBill, Cashbox, Voucher, MaintenanceTicket, Notification

class UserSerializer(serializers.ModelSerializer):
    organization = serializers.CharField(source="organization.name", read_only=True)
    class Meta:
        model = User
        fields = ["id", "username", "email", "first_name", "last_name", "phone", "role", "organization", "can_collect_rent", "can_collect_services", "can_collect_maintenance", "can_create_services"]

class OrganizationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Organization
        fields = ["id", "name", "slug", "currency", "timezone", "is_active"]

class PropertySerializer(serializers.ModelSerializer):
    units_count = serializers.IntegerField(source="units.count", read_only=True)
    occupied_count = serializers.SerializerMethodField()
    class Meta:
        model = Property
        fields = ["id", "name", "code", "address", "city", "owner", "units_count", "occupied_count"]
    def get_occupied_count(self, obj): return obj.units.filter(status=Unit.Status.RENTED).count()

class UnitSerializer(serializers.ModelSerializer):
    property_name = serializers.CharField(source="property.name", read_only=True)
    class Meta:
        model = Unit
        fields = ["id", "property", "property_name", "number", "floor", "status", "area_sqm"]

class PartySerializer(serializers.ModelSerializer):
    class Meta:
        model = Party
        fields = ["id", "kind", "name", "national_id", "phone", "email", "user"]

class InstallmentSerializer(serializers.ModelSerializer):
    remaining = serializers.SerializerMethodField()
    class Meta:
        model = Installment
        fields = ["id", "agreement", "due_date", "amount", "paid_amount", "remaining", "status", "sequence"]
    def get_remaining(self, obj): return str(obj.amount - obj.paid_amount)

class AgreementSerializer(serializers.ModelSerializer):
    unit_number = serializers.CharField(source="unit.number", read_only=True)
    property_name = serializers.CharField(source="unit.property.name", read_only=True)
    tenant_name = serializers.CharField(source="tenant.name", read_only=True)
    installments = InstallmentSerializer(many=True, read_only=True)
    class Meta:
        model = Agreement
        fields = ["id", "number", "unit", "unit_number", "property_name", "tenant", "tenant_name", "start_date", "end_date", "annual_rent", "deposit", "status", "installments"]

class ServiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Service
        fields = ["id", "name", "unit", "payer", "active"]

class MeterReadingSerializer(serializers.ModelSerializer):
    recorded_by = serializers.PrimaryKeyRelatedField(read_only=True)
    class Meta:
        model = MeterReading
        fields = ["id", "service", "reading_date", "value", "recorded_by", "created_at"]
    def create(self, validated_data): return MeterReading.objects.create(**validated_data, recorded_by=self.context["request"].user, organization=self.context["request"].user.organization)

class ServiceBillSerializer(serializers.ModelSerializer):
    service_name = serializers.CharField(source="service.name", read_only=True)
    class Meta:
        model = ServiceBill
        fields = ["id", "service", "service_name", "period", "amount", "status", "issued_at"]

class CashboxSerializer(serializers.ModelSerializer):
    class Meta:
        model = Cashbox
        fields = ["id", "name", "balance", "is_active"]

class VoucherSerializer(serializers.ModelSerializer):
    posted_by = serializers.PrimaryKeyRelatedField(read_only=True)
    class Meta:
        model = Voucher
        fields = ["id", "number", "cashbox", "kind", "amount", "reference", "status", "posted_by", "idempotency_key", "created_at"]
        read_only_fields = ["number", "status", "posted_by", "created_at"]

class MaintenanceSerializer(serializers.ModelSerializer):
    class Meta:
        model = MaintenanceTicket
        fields = ["id", "unit", "title", "description", "priority", "status", "reported_by", "created_at"]
        read_only_fields = ["reported_by"]

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ["id", "title", "body", "read_at", "severity", "created_at"]

class DashboardSerializer(serializers.Serializer):
    organization = OrganizationSerializer()
    role = serializers.CharField()
    currency = serializers.CharField()
    metrics = serializers.DictField()
    agreements = AgreementSerializer(many=True)
    properties = PropertySerializer(many=True)
    notifications = NotificationSerializer(many=True)
