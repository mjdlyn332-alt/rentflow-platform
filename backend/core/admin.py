from django.contrib import admin
from .models import *

for model in [Organization, User, Property, Unit, Party, Agreement, Installment, Service, MeterReading, ServiceBill, Cashbox, Voucher, MaintenanceTicket, Notification, AuditEvent, Account, JournalEntry, JournalLine]:
    admin.site.register(model)
