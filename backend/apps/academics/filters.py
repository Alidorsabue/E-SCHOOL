import django_filters
from django.db.models import Q

from .models import GradeBulletin, Attendance


class AttendanceFilterSet(django_filters.FilterSet):
    date_after = django_filters.DateFilter(field_name='date', lookup_expr='gte', label='Du (date)')
    date_before = django_filters.DateFilter(field_name='date', lookup_expr='lte', label='Au (date)')

    class Meta:
        model = Attendance
        fields = ['student', 'school_class', 'status', 'date', 'subject']


class GradeBulletinFilterSet(django_filters.FilterSet):
    """Filtre school_class: inclut aussi les bulletins avec school_class=null dont l'élève
    a un parcours (class_enrollments) dans la classe demandée — pour afficher les notes
    dans « Ma classe » même lorsque school_class n'a pas été renseigné à la création.
    """
    school_class = django_filters.NumberFilter(method='filter_school_class', label='Classe')

    class Meta:
        model = GradeBulletin
        fields = ['student', 'student__school_class', 'subject', 'academic_year']

    def filter_school_class(self, queryset, name, value):
        if value is None or value == '':
            return queryset
        return queryset.filter(
            Q(school_class_id=value)
            | Q(school_class__isnull=True, student__class_enrollments__school_class_id=value)
        ).distinct()
