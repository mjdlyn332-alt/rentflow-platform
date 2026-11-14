from decimal import Decimal
from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient
from .models import Organization, Property, Cashbox, Voucher

class OrganizationIsolationTests(TestCase):
    def setUp(self):
        self.org_a = Organization.objects.create(name="A", slug="a")
        self.org_b = Organization.objects.create(name="B", slug="b")
        self.user = get_user_model().objects.create_user(username="owner", password="pass", organization=self.org_a, role="OWNER")
        self.client = APIClient()
        self.client.force_authenticate(self.user)
        Property.objects.create(organization=self.org_a, name="A property", code="A-1")
        Property.objects.create(organization=self.org_b, name="B property", code="B-1")
    def test_property_list_is_organization_scoped(self):
        response = self.client.get("/api/properties")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["name"], "A property")

class VoucherAtomicityTests(TestCase):
    def setUp(self):
        self.org = Organization.objects.create(name="A", slug="atomic")
        self.user = get_user_model().objects.create_user(username="collector", password="pass", organization=self.org, role="COLLECTOR", can_collect_rent=True)
        self.cashbox = Cashbox.objects.create(organization=self.org, name="Main")
        self.client = APIClient(); self.client.force_authenticate(self.user)
    def test_idempotency_does_not_double_count(self):
        payload = {"cashbox": str(self.cashbox.id), "kind": "RENT", "amount": "100.00", "idempotency_key": "same-1"}
        first = self.client.post("/api/vouchers", payload, format="json")
        second = self.client.post("/api/vouchers", payload, format="json")
        self.assertEqual(first.status_code, 201); self.assertEqual(second.status_code, 200)
        self.cashbox.refresh_from_db()
        self.assertEqual(self.cashbox.balance, Decimal("100.00"))
        self.assertEqual(Voucher.objects.count(), 1)
