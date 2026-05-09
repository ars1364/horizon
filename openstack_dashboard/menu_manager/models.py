from django.db import models


class MenuLabel(models.Model):
    slug = models.CharField(max_length=100, unique=True)
    custom_label = models.CharField(max_length=200)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'menu_label'
        ordering = ['slug']

    def __str__(self):
        return f"{self.slug} → {self.custom_label}"
