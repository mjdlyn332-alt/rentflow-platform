import uuid
from decimal import Decimal
from django.contrib.auth.models import AbstractUser
from django.core.validators import MinValueValidator
from django.db import models

class TimeStamped(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    class Meta:
        abstract = True

class Organization(TimeStamped):
    name = models.CharField(max_length=160)
    slug = models.SlugField(max_length=80, unique=True)
    currency = models.CharField(max_length=3, default="SAR")
    timezone = models.CharField(max_length=64, default="Asia/Riyadh")
    is_active = models.BooleanField(default=True)
    def __str__(self): return self.name

class User(AbstractUser):
    class Role(models.TextChoices):
        SUPER_ADMIN = "SUPER_ADMIN", "Super Admin"
        OWNER = "OWNER", "Owner"
        STAFF = "STAFF", "Staff"
        COLLECTOR = "COLLECTOR", "Collector"
        RENTER = "RENTER", "Renter"
        UNIT_OWNER = "UNIT_OWNER", "Unit Owner"
    organization = models.ForeignKey(Organization, null=True, blank=True, on_delete=models.PROTECT, related_name="users")
    role = models.CharField(max_length=20, choices=Role.choices, default=Role.RENTER)
    token_version = models.PositiveIntegerField(default=1)
    phone = models.CharField(max_length=32, blank=True)
    can_collect_rent = models.BooleanField(default=False)
    can_collect_services = models.BooleanField(default=False)
    can_collect_maintenance = models.BooleanField(default=False)
    can_create_services = models.BooleanField(default=False)

class Property(TimeStamped):
    organization = models.ForeignKey(Organization, on_delete=models.PROTECT, related_name="properties")
    name = models.CharField(max_length=160)
    code = models.CharField(max_length=50)
    address = models.CharField(max_length=255, blank=True)
    city = models.CharField(max_length=80, blank=True)
    owner = models.ForeignKey(User, null=True, blank=True, on_delete=models.PROTECT, related_name="owned_properties")
    class Meta:
        constraints = [models.UniqueConstraint(fields=["organization", "code"], name="uniq_property_code_per_org")]
        ordering = ["name"]

class Unit(TimeStamped):
    class Status(models.TextChoices):
        VACANT = "VACANT", "Vacant"
        RENTED = "RENTED", "Rented"
        MAINTENANCE = "MAINTENANCE", "Maintenance"
    organization = models.ForeignKey(Organization, on_delete=models.PROTECT, related_name="units")
    property = models.ForeignKey(Property, on_delete=models.PROTECT, related_name="units")
    number = models.CharField(max_length=40)
    floor = models.CharField(max_length=20, blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.VACANT)
    area_sqm = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    class Meta:
        constraints = [models.UniqueConstraint(fields=["organization", "property", "number"], name="uniq_unit_number_per_property")]

class Party(TimeStamped):
    class Kind(models.TextChoices):
        TENANT = "TENANT", "Tenant"
        OWNER = "OWNER", "Owner"
        VENDOR = "VENDOR", "Vendor"
    organization = models.ForeignKey(Organization, on_delete=models.PROTECT, related_name="parties")
    kind = models.CharField(max_length=20, choices=Kind.choices)
    name = models.CharField(max_length=160)
    national_id = models.CharField(max_length=40, blank=True)
    phone = models.CharField(max_length=32, blank=True)
    email = models.EmailField(blank=True)
    user = models.OneToOneField(User, null=True, blank=True, on_delete=models.SET_NULL, related_name="party")

class Agreement(TimeStamped):
    class Status(models.TextChoices):
        DRAFT = "DRAFT", "Draft"
        ACTIVE = "ACTIVE", "Active"
        EXPIRED = "EXPIRED", "Expired"
        TERMINATED = "TERMINATED", "Terminated"
    organization = models.ForeignKey(Organization, on_delete=models.PROTECT, related_name="agreements")
    unit = models.ForeignKey(Unit, on_delete=models.PROTECT, related_name="agreements")
    tenant = models.ForeignKey(Party, on_delete=models.PROTECT, related_name="agreements")
    number = models.CharField(max_length=60)
    start_date = models.DateField()
    end_date = models.DateField()
    annual_rent = models.DecimalField(max_digits=14, decimal_places=2, validators=[MinValueValidator(Decimal("0"))])
    deposit = models.DecimalField(max_digits=14, decimal_places=2, default=0, validators=[MinValueValidator(Decimal("0"))])
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.DRAFT)
    class Meta:
        constraints = [models.UniqueConstraint(fields=["organization", "number"], name="uniq_agreement_number_per_org")]

class Installment(TimeStamped):
    class Status(models.TextChoices):
        SCHEDULED = "SCHEDULED", "Scheduled"
        DUE = "DUE", "Due"
        PARTIAL = "PARTIAL", "Partial"
        PAID = "PAID", "Paid"
        VOID = "VOID", "Void"
    organization = models.ForeignKey(Organization, on_delete=models.PROTECT, related_name="installments")
    agreement = models.ForeignKey(Agreement, on_delete=models.PROTECT, related_name="installments")
    due_date = models.DateField()
    amount = models.DecimalField(max_digits=14, decimal_places=2, validators=[MinValueValidator(Decimal("0"))])
    paid_amount = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.SCHEDULED)
    sequence = models.PositiveIntegerField()
    class Meta:
        ordering = ["due_date", "sequence"]

class Service(TimeStamped):
    organization = models.ForeignKey(Organization, on_delete=models.PROTECT, related_name="services")
    name = models.CharField(max_length=120)
    unit = models.ForeignKey(Unit, on_delete=models.PROTECT, related_name="services")
    payer = models.CharField(max_length=20, choices=[("TENANT", "Tenant"), ("OWNER", "Owner")], default="TENANT")
    active = models.BooleanField(default=True)

class MeterReading(TimeStamped):
    organization = models.ForeignKey(Organization, on_delete=models.PROTECT, related_name="meter_readings")
    service = models.ForeignKey(Service, on_delete=models.PROTECT, related_name="readings")
    reading_date = models.DateField()
    value = models.DecimalField(max_digits=14, decimal_places=3, validators=[MinValueValidator(Decimal("0"))])
    recorded_by = models.ForeignKey(User, on_delete=models.PROTECT)
    class Meta:
        constraints = [models.UniqueConstraint(fields=["service", "reading_date"], name="uniq_service_reading_day")]

class ServiceBill(TimeStamped):
    class Status(models.TextChoices):
        ISSUED = "ISSUED", "Issued"
        PARTIAL = "PARTIAL", "Partial"
        PAID = "PAID", "Paid"
        VOID = "VOID", "Void"
    organization = models.ForeignKey(Organization, on_delete=models.PROTECT, related_name="service_bills")
    service = models.ForeignKey(Service, on_delete=models.PROTECT, related_name="bills")
    period = models.CharField(max_length=20)
    amount = models.DecimalField(max_digits=14, decimal_places=2, validators=[MinValueValidator(Decimal("0"))])
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.ISSUED)
    issued_at = models.DateTimeField()

class Cashbox(TimeStamped):
    organization = models.ForeignKey(Organization, on_delete=models.PROTECT, related_name="cashboxes")
    name = models.CharField(max_length=120)
    balance = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    is_active = models.BooleanField(default=True)

class Voucher(TimeStamped):
    class Kind(models.TextChoices):
        RENT = "RENT", "Rent"
        SERVICE = "SERVICE", "Service"
        MAINTENANCE = "MAINTENANCE", "Maintenance"
        TRANSFER = "TRANSFER", "Transfer"
    class Status(models.TextChoices):
        POSTED = "POSTED", "Posted"
        REVERSED = "REVERSED", "Reversed"
    organization = models.ForeignKey(Organization, on_delete=models.PROTECT, related_name="vouchers")
    cashbox = models.ForeignKey(Cashbox, on_delete=models.PROTECT, related_name="vouchers")
    number = models.CharField(max_length=60)
    kind = models.CharField(max_length=20, choices=Kind.choices)
    amount = models.DecimalField(max_digits=14, decimal_places=2, validators=[MinValueValidator(Decimal("0.01"))])
    reference = models.CharField(max_length=120, blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.POSTED)
    posted_by = models.ForeignKey(User, on_delete=models.PROTECT, related_name="posted_vouchers")
    idempotency_key = models.CharField(max_length=120, unique=True)
    reversed_voucher = models.ForeignKey("self", null=True, blank=True, on_delete=models.PROTECT)
    class Meta:
        ordering = ["-created_at"]

class MaintenanceTicket(TimeStamped):
    class Status(models.TextChoices):
        OPEN = "OPEN", "Open"
        ASSIGNED = "ASSIGNED", "Assigned"
        DONE = "DONE", "Done"
        CANCELLED = "CANCELLED", "Cancelled"
    organization = models.ForeignKey(Organization, on_delete=models.PROTECT, related_name="maintenance_tickets")
    unit = models.ForeignKey(Unit, on_delete=models.PROTECT, related_name="maintenance_tickets")
    title = models.CharField(max_length=180)
    description = models.TextField()
    priority = models.CharField(max_length=20, default="NORMAL")
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.OPEN)
    reported_by = models.ForeignKey(User, on_delete=models.PROTECT, related_name="reported_tickets")

class Notification(TimeStamped):
    organization = models.ForeignKey(Organization, on_delete=models.PROTECT, related_name="notifications")
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="notifications")
    title = models.CharField(max_length=180)
    body = models.TextField()
    read_at = models.DateTimeField(null=True, blank=True)
    severity = models.CharField(max_length=20, default="INFO")

class AuditEvent(TimeStamped):
    organization = models.ForeignKey(Organization, on_delete=models.PROTECT, related_name="audit_events")
    actor = models.ForeignKey(User, null=True, on_delete=models.PROTECT)
    action = models.CharField(max_length=80)
    entity = models.CharField(max_length=80)
    entity_id = models.CharField(max_length=80)
    metadata = models.JSONField(default=dict)

class Account(TimeStamped):
    organization = models.ForeignKey(Organization, on_delete=models.PROTECT, related_name="accounts")
    code = models.CharField(max_length=20)
    name = models.CharField(max_length=160)
    kind = models.CharField(max_length=20, choices=[("ASSET", "Asset"), ("LIABILITY", "Liability"), ("REVENUE", "Revenue"), ("EXPENSE", "Expense"), ("EQUITY", "Equity")])
    class Meta:
        constraints = [models.UniqueConstraint(fields=["organization", "code"], name="uniq_account_code_per_org")]

class JournalEntry(TimeStamped):
    organization = models.ForeignKey(Organization, on_delete=models.PROTECT, related_name="journal_entries")
    reference = models.CharField(max_length=120)
    description = models.CharField(max_length=255)
    posted_at = models.DateTimeField()
    is_posted = models.BooleanField(default=True)

class JournalLine(TimeStamped):
    entry = models.ForeignKey(JournalEntry, on_delete=models.PROTECT, related_name="lines")
    account = models.ForeignKey(Account, on_delete=models.PROTECT, related_name="lines")
    debit = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    credit = models.DecimalField(max_digits=14, decimal_places=2, default=0)
