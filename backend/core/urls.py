from django.urls import include, path
from rest_framework.routers import DefaultRouter
from .views import PropertyViewSet, UnitViewSet, PartyViewSet, AgreementViewSet, InstallmentViewSet, ServiceViewSet, MeterReadingViewSet, ServiceBillViewSet, CashboxViewSet, VoucherViewSet, MaintenanceViewSet, NotificationViewSet, DashboardView

router = DefaultRouter(trailing_slash=False)
router.register("properties", PropertyViewSet, basename="property")
router.register("units", UnitViewSet, basename="unit")
router.register("parties", PartyViewSet, basename="party")
router.register("agreements", AgreementViewSet, basename="agreement")
router.register("installments", InstallmentViewSet, basename="installment")
router.register("services", ServiceViewSet, basename="service")
router.register("readings", MeterReadingViewSet, basename="reading")
router.register("service-bills", ServiceBillViewSet, basename="service-bill")
router.register("cashboxes", CashboxViewSet, basename="cashbox")
router.register("vouchers", VoucherViewSet, basename="voucher")
router.register("maintenance", MaintenanceViewSet, basename="maintenance")
router.register("notifications", NotificationViewSet, basename="notification")

urlpatterns = [path("dashboard", DashboardView.as_view()), path("", include(router.urls))]
