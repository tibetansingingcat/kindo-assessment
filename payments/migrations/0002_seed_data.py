from django.db import migrations


def seed_data(apps, schema_editor):
    School = apps.get_model("payments", "School")
    Trip = apps.get_model("payments", "Trip")

    s1 = School.objects.create(name="Kowhai Primary", address="42 Kowhai Road, Auckland")
    s2 = School.objects.create(name="Rimu Heights School", address="15 Rimu Street, Wellington")

    Trip.objects.create(
        title="Museum Field Trip",
        school=s1,
        description="A visit to Auckland Museum to explore natural history and Maori culture exhibits.",
        date="2026-04-15",
        location="Auckland Museum",
        cost="45.00",
    )
    Trip.objects.create(
        title="Zoo Adventure",
        school=s1,
        description="A day at Auckland Zoo learning about native and exotic wildlife.",
        date="2026-05-20",
        location="Auckland Zoo",
        cost="30.00",
    )
    Trip.objects.create(
        title="Botanical Gardens Walk",
        school=s2,
        description="Guided tour through the Wellington Botanic Garden with a focus on native plants.",
        date="2026-06-10",
        location="Wellington Botanic Garden",
        cost="15.00",
    )
    Trip.objects.create(
        title="Te Papa Museum Visit",
        school=s2,
        description="Interactive exhibits on New Zealand history, art, and science.",
        date="2026-07-08",
        location="Te Papa Tongarewa",
        cost="25.00",
    )


def remove_data(apps, schema_editor):
    Trip = apps.get_model("payments", "Trip")
    School = apps.get_model("payments", "School")
    Trip.objects.all().delete()
    School.objects.all().delete()


class Migration(migrations.Migration):

    dependencies = [
        ("payments", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(seed_data, remove_data),
    ]
