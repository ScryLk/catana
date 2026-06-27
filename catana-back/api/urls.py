from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    UserViewSet, ProductViewSet, MediaViewSet, MediaFolderViewSet, ThemeViewSet, CatalogViewSet, PageViewSet,
    ComponentViewSet, PageComponentViewSet, CommentViewSet, ActivityViewSet, OrganizationViewSet, SedeViewSet,
    SedeSharingViewSet, CategoryViewSet,
    profile_view, upload_avatar, change_password, preferences_view, recent_activity, logout_all_sessions,
    register_user, dashboard_stats, ExploreProductViewSet, global_search
)
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'organizations', OrganizationViewSet)
router.register(r'sedes', SedeViewSet)
router.register(r'sede-shares', SedeSharingViewSet)
router.register(r'categories', CategoryViewSet)
router.register(r'products', ProductViewSet)
router.register(r'explore/products', ExploreProductViewSet, basename='explore-products')
router.register(r'media-folders', MediaFolderViewSet)
router.register(r'media', MediaViewSet)
router.register(r'themes', ThemeViewSet)
router.register(r'catalogs', CatalogViewSet)
router.register(r'pages', PageViewSet)
router.register(r'components', ComponentViewSet)
router.register(r'page-components', PageComponentViewSet)
router.register(r'comments', CommentViewSet)
router.register(r'activities', ActivityViewSet)

from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView, SpectacularRedocView

urlpatterns = [
    path('', include(router.urls)),
    path('auth/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('register/', register_user, name='register'),
    path('dashboard/stats/', dashboard_stats, name='dashboard_stats'),

    # Profile endpoints
    path('profile/', profile_view, name='profile'),
    path('profile/avatar/', upload_avatar, name='upload_avatar'),
    path('profile/change-password/', change_password, name='change_password'),
    path('profile/preferences/', preferences_view, name='preferences'),
    path('profile/activity/', recent_activity, name='recent_activity'),
    path('profile/logout-all/', logout_all_sessions, name='logout_all_sessions'),

    # Search endpoints
    path('search/global/', global_search, name='global_search'),

    path('schema/', SpectacularAPIView.as_view(), name='schema'),
    path('schema/swagger-ui/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('schema/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
]

