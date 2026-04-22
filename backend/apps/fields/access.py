from apps.fields.models import Field


def get_managed_fields_queryset(user, queryset=None):
    base_queryset = queryset if queryset is not None else Field.objects.all()

    if not user.is_authenticated or not user.is_staff:
        return base_queryset.none()

    if user.is_superuser:
        return base_queryset

    return base_queryset.filter(owner=user)


def can_manage_field(user, field):
    if not user.is_authenticated or not user.is_staff:
        return False

    if user.is_superuser:
        return True

    return field.owner_id == user.id
