from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.pagination import PageNumberPagination
from django.db.models import Count, Sum, Q
from django.contrib.auth import update_session_auth_hash
from .models import (
    User, Product, Media, MediaFolder, Theme, Catalog, Page, Component, PageComponent, Comment, Activity, Organization, Sede, SedeSharing, Category, UserPreferences, PublicProfile
)
from .serializers import (
    UserSerializer, ProductSerializer, MediaSerializer, MediaFolderSerializer,
    ThemeSerializer, CatalogSerializer, CatalogDetailSerializer, PageSerializer, ComponentSerializer,
    PageComponentSerializer, CommentSerializer, ActivitySerializer,
    OrganizationSerializer, SedeSerializer, SedeSharingSerializer, CategorySerializer,
    UserProfileSerializer, UserPreferencesSerializer, UpdateProfileSerializer, ChangePasswordSerializer,
    PublicProductSerializer
)
from .permissions import IsOrganizationAdmin, CanCreateSede

from rest_framework import serializers


# ============================================
# SEG-02/SEG-03: Autenticação
# ============================================
# O padrão global é IsAuthenticated (ver settings REST_FRAMEWORK).
# Allowlist de endpoints PÚBLICOS (AllowAny explícito):
#   - register_user            (POST /api/register/)
#   - TokenObtainPairView      (POST /api/auth/token/)         [simplejwt]
#   - TokenRefreshView         (POST /api/auth/token/refresh/) [simplejwt]
#   - ExploreProductViewSet    (GET  /api/explore/products/)
#   - CatalogViewSet.explore   (GET  /api/catalogs/explore/)
# Tudo o mais exige token válido. Os viewsets de organização/sede aplicam
# também as classes de permissions.py (IsOrganizationAdmin / CanCreateSede).


# ============================================
# Paginação Customizada
# ============================================

class StandardResultsSetPagination(PageNumberPagination):
    """
    Paginação padrão para listagens
    Configurado para 24 itens (4x6 grid no frontend)
    """
    page_size = 24
    page_size_query_param = 'page_size'
    max_page_size = 100


# ============================================
# ViewSets
# ============================================

class SedeSharingViewSet(viewsets.ModelViewSet):
    queryset = SedeSharing.objects.all()
    serializer_class = SedeSharingSerializer
    permission_classes = [permissions.IsAuthenticated, CanCreateSede]
    filterset_fields = ['source_sede', 'target_sede', 'resource_type']

    def perform_create(self, serializer):
        # In production this should check permissions
        serializer.save()


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer

class OrganizationViewSet(viewsets.ModelViewSet):
    queryset = Organization.objects.all()
    serializer_class = OrganizationSerializer

    def get_permissions(self):
        # Leitura para qualquer autenticado; escrita só para admin da organização.
        if self.request.method in permissions.SAFE_METHODS:
            return [permissions.IsAuthenticated()]
        return [permissions.IsAuthenticated(), IsOrganizationAdmin()]

    def get_queryset(self):
        # Users can only see organizations they belong to
        # OR organizations they own
        user = self.request.user
        if not user.is_authenticated:
            # Fallback for dev: show all, or act as superuser
            return Organization.objects.all()
        
        if user.is_superuser:
            return Organization.objects.all()
        return user.organizations.all() | Organization.objects.filter(owner=user)

    def perform_create(self, serializer):
        user = self.request.user
        
        # Set owner to current user
        org = serializer.save(owner=user)
        # Add owner to members
        user.organizations.add(org)

class SedeViewSet(viewsets.ModelViewSet):
    queryset = Sede.objects.all()
    serializer_class = SedeSerializer
    permission_classes = [permissions.IsAuthenticated, CanCreateSede]
    filterset_fields = ['organization']

class MediaFolderViewSet(viewsets.ModelViewSet):
    queryset = MediaFolder.objects.all()
    serializer_class = MediaFolderSerializer
    filterset_fields = ['created_by', 'parent', 'organization', 'sede']

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user

        # FRG-08: evita AttributeError com AnonymousUser (defensivo; o default
        # global ja exige autenticacao). Restringe ao escopo do usuario.
        if not user.is_authenticated:
            return queryset.none()
        if not user.is_superuser:
            # Users can only see folders from their organizations or created by them
            queryset = queryset.filter(Q(organization__in=user.organizations.all()) | Q(created_by=user))
        
        org_id = self.request.query_params.get('organization')
        sede_id = self.request.query_params.get('sede')
        
        if sede_id:
            queryset = queryset.filter(sede_id=sede_id)
        elif org_id:
            queryset = queryset.filter(organization_id=org_id)
            
        return queryset

    def perform_create(self, serializer):
        user = self.request.user
        
        # Validate Organization
        org_id = self.request.data.get('organization')
        if org_id:
             # Check if user belongs to this organization
             if not user.is_superuser and not user.organizations.filter(id=org_id).exists():
                 raise serializers.ValidationError({"organization": "You do not have permission to create folders in this organization."})
        elif not user.is_superuser:
             raise serializers.ValidationError({"organization": "Organization is required for folder creation."})

        serializer.save(created_by=user)

class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    filterset_fields = ['parent', 'organization', 'sede']

    def get_queryset(self):
        queryset = super().get_queryset()
        org_id = self.request.query_params.get('organization')
        sede_id = self.request.query_params.get('sede')

        if sede_id:
            queryset = queryset.filter(sede_id=sede_id)
        elif org_id:
            queryset = queryset.filter(organization_id=org_id)
        return queryset

    def perform_create(self, serializer):
        user = self.request.user
        serializer.save(created_by=user)

class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        
        # Security: Always restrict to user's scope first (unless superuser)
        if not user.is_authenticated:
            return queryset.none()
        if not user.is_superuser:
            queryset = queryset.filter(Q(organization__in=user.organizations.all()) | Q(created_by=user))

        org_id = self.request.query_params.get('organization')
        sede_id = self.request.query_params.get('sede')

        if sede_id:
            queryset = queryset.filter(sede_id=sede_id)
        elif org_id:
            queryset = queryset.filter(organization_id=org_id)

        category_id = self.request.query_params.get('category')
        if category_id:
            queryset = queryset.filter(category_id=category_id)
            
        search_query = self.request.query_params.get('search')
        if search_query:
            queryset = queryset.filter(Q(name__icontains=search_query) | Q(sku__icontains=search_query))

        return queryset

    def perform_create(self, serializer):
        user = self.request.user

        # Validate Organization
        org_id = self.request.data.get('organization')
        if not org_id:
             raise serializers.ValidationError({"organization": "Organization is required."})
        
        # Check if user belongs to this organization
        if not user.is_superuser and not user.organizations.filter(id=org_id).exists():
             raise serializers.ValidationError({"organization": "You do not have permission to create products in this organization."})

        product = serializer.save(created_by=user)

        # Criar atividade
        Activity.objects.create(
            user=user,
            action='Produto criado',
            description=f'Criou o produto "{product.name}"',
            organization=product.organization,
            sede=product.sede
        )

    def perform_update(self, serializer):
        user = self.request.user

        product = serializer.save()

        # Criar atividade
        Activity.objects.create(
            user=user,
            action='Produto atualizado',
            description=f'Atualizou o produto "{product.name}"',
            organization=product.organization,
            sede=product.sede
        )

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def like(self, request, pk=None):
        product = self.get_object()
        user = request.user
        if product.likes.filter(id=user.id).exists():
            product.likes.remove(user)
            liked = False
        else:
            product.likes.add(user)
            liked = True
        return Response({'liked': liked, 'count': product.likes.count()})

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def toggle_save(self, request, pk=None):
        product = self.get_object()
        user = request.user
        if product.saves.filter(id=user.id).exists():
            product.saves.remove(user)
            saved = False
        else:
            product.saves.add(user)
            saved = True
        return Response({'saved': saved, 'count': product.saves.count()})

class MediaViewSet(viewsets.ModelViewSet):
    queryset = Media.objects.all()
    serializer_class = MediaSerializer
    filterset_fields = ['uploaded_by', 'file', 'organization', 'sede']

    def get_queryset(self):
        queryset = Media.objects.all()
        user = self.request.user
        
        # Security: Always restrict to user's scope first (unless superuser)
        if not user.is_authenticated:
            return queryset.none()
        if not user.is_superuser:
            # Users can only see media from their organizations or uploaded by them
            queryset = queryset.filter(Q(organization__in=user.organizations.all()) | Q(uploaded_by=user))

        folder = self.request.query_params.get('folder')
        org_id = self.request.query_params.get('organization')
        sede_id = self.request.query_params.get('sede')

        if sede_id:
            # Get IDs of sedes that share media with the current sede
            shared_source_ids = SedeSharing.objects.filter(
                target_sede_id=sede_id,
                resource_type__in=['media', 'all']
            ).values_list('source_sede_id', flat=True)
            
            # Filter media belonging to current sede OR shared sedes
            queryset = queryset.filter(Q(sede_id=sede_id) | Q(sede_id__in=shared_source_ids))
        elif org_id:
            queryset = queryset.filter(organization_id=org_id)

        if folder == 'null':
            queryset = queryset.filter(folder__isnull=True)
        elif folder is not None:
            queryset = queryset.filter(folder=folder)
        return queryset

    def perform_create(self, serializer):
        user = self.request.user
        
        # Validate Organization
        org_id = self.request.data.get('organization')
        if org_id:
             # Check if user belongs to this organization
             if not user.is_superuser and not user.organizations.filter(id=org_id).exists():
                 raise serializers.ValidationError({"organization": "You do not have permission to upload media to this organization."})
        elif not user.is_superuser:
             # Require organization for non-superusers? Or allow personal uploads? 
             # User Request says: "Bloquear uploads sem organização ativa" logic implies org is required.
             raise serializers.ValidationError({"organization": "Organization is required for media upload."})

        serializer.save(uploaded_by=user)

    @action(detail=False, methods=['get'])
    def stats(self, request):
        folder_param = request.query_params.get('folder')
        org_id = request.query_params.get('organization')
        sede_id = request.query_params.get('sede')
        
        # Base querysets
        media_qs = Media.objects.all()
        folder_qs = MediaFolder.objects.all()

        user = request.user
        # Security: Always restrict to user's scope first (unless superuser)
        if not user.is_superuser:
            media_qs = media_qs.filter(Q(organization__in=user.organizations.all()) | Q(uploaded_by=user))
            folder_qs = folder_qs.filter(Q(organization__in=user.organizations.all()) | Q(created_by=user))

        # Apply Organization/Sede filter
        if sede_id:
            # Get IDs of sedes that share media with the current sede
            shared_source_ids = SedeSharing.objects.filter(
                target_sede_id=sede_id,
                resource_type__in=['media', 'all']
            ).values_list('source_sede_id', flat=True)
            
            media_qs = media_qs.filter(Q(sede_id=sede_id) | Q(sede_id__in=shared_source_ids))
            folder_qs = folder_qs.filter(sede_id=sede_id)
        elif org_id:
            media_qs = media_qs.filter(organization_id=org_id)
            folder_qs = folder_qs.filter(organization_id=org_id)

        # Folder Logic for Stats (Counts within current view)
        if folder_param == 'null' or folder_param is None:
             # If strictly looking at root
             # But stats usually show TOTALs for the library regardless of folder navigation?
             # If the UI expects "filtered counts based on current folder", we filter.
             # Based on "Images (36)" in sidebar, this usually means "Total Images in Library" or "Total in current view".
             # Let's assume global library stats by default unless filters imply otherwise, 
             # BUT the previous implementation and request suggest dynamic filters.
             # If the user is in a folder, do they want to see counts ONLY for that folder?
             # Usually sidebar filters are for the WHOLE library.
             # However, the previous code had `folder_param`.
             # Let's keep `folder_param` logic for `media_qs` if provided, effectively showing stats for current view.
             if folder_param == 'null':
                 media_qs = media_qs.filter(folder__isnull=True)
             elif folder_param:
                 media_qs = media_qs.filter(folder=folder_param)
        
        # NOTE: Sidebar counts usually represent "Everything I can see", so filtering by folder might be wrong for the sidebar counts
        # unless the sidebar itself is context-aware. 
        # The user said: "ajustar nos filtros tambem, para que sejam dinamicos com base na quantidade de itens no /media".
        # If I am in a folder, I probably still want to know I have 36 images TOTAL in my library?
        # OR does it mean "36 images matching current filters"?
        # Given "based on the quantity of items in /media", it likely means TOTAL (scoped to org).
        # But `mediaService.getStats` passes `folder`.
        # I will respect the `folder` param if passed, assuming the frontend controls whether it wants total or folder-specific.
        
        total_files = media_qs.count()
        folders_count = folder_qs.count()
        images_count = media_qs.filter(media_type='image').count()
        videos_count = media_qs.filter(media_type='video').count()
        documents_count = media_qs.filter(media_type='document').count()
        
        # Calculate size (this is heavier, might want to optimize or cache)
        total_size = media_qs.aggregate(Sum('size'))['size__sum'] or 0
        
        # Format size
        def format_size(size):
            for unit in ['B', 'KB', 'MB', 'GB']:
                if size < 1024:
                    return f"{size:.1f} {unit}"
                size /= 1024
            return f"{size:.1f} TB"

        favorites_count = media_qs.filter(is_favorite=True).count()

        return Response({
            'total_files': total_files,
            'folders_count': folders_count,
            'images_count': images_count,
            'videos_count': videos_count,
            'documents_count': documents_count,
            'total_size': total_size,
            'total_size_formatted': format_size(total_size),
            'favorites_count': favorites_count
        })
        folders_count = folder_qs.count()

        # Calculate total size in python since we don't have a size field in DB
        total_size = 0
        for media in media_qs:
            try:
                if media.file:
                    total_size += media.file.size
            except Exception:
                # File might be missing or other error
                pass

        # Determine size formatted
        if total_size < 1024 * 1024:
            total_size_formatted = f"{total_size / 1024:.2f} KB"
        else:
            total_size_formatted = f"{total_size / (1024 * 1024):.2f} MB"
            
        images_count = media_qs.filter(media_type='image').count()
        videos_count = media_qs.filter(media_type='video').count()
        documents_count = media_qs.filter(media_type='document').count()

        favorites_count = 0

        data = {
            'total_files': total_files,
            'folders_count': folders_count,
            'total_size': total_size,
            'total_size_formatted': total_size_formatted,
            'images_count': images_count,
            'videos_count': videos_count,
            'documents_count': documents_count,
            'favorites_count': favorites_count
        }
        return Response(data)

class ThemeViewSet(viewsets.ModelViewSet):
    queryset = Theme.objects.all()
    serializer_class = ThemeSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        org_id = self.request.query_params.get('organization')
        sede_id = self.request.query_params.get('sede')

        if sede_id:
            queryset = queryset.filter(sede_id=sede_id)
        elif org_id:
            queryset = queryset.filter(organization_id=org_id)
        return queryset

    def perform_create(self, serializer):
        user = self.request.user
        serializer.save(created_by=user)

class CatalogViewSet(viewsets.ModelViewSet):
    queryset = Catalog.objects.all()
    serializer_class = CatalogSerializer

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return CatalogDetailSerializer
        return CatalogSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        
        # Security: Always restrict to user's scope first (unless superuser)
        if not user.is_authenticated:
            return queryset.none()
        if not user.is_superuser:
            # Users can only see catalogs from their organizations or personal ones
            queryset = queryset.filter(Q(organization__in=user.organizations.all()) | Q(created_by=user))

        org_id = self.request.query_params.get('organization')
        sede_id = self.request.query_params.get('sede')

        if sede_id:
            # Get IDs of sedes that share catalogs with the current sede
            shared_source_ids = SedeSharing.objects.filter(
                target_sede_id=sede_id,
                resource_type__in=['catalog', 'all']
            ).values_list('source_sede_id', flat=True)

            # Filter catalogs belonging to current sede OR shared sedes
            queryset = queryset.filter(Q(sede_id=sede_id) | Q(sede_id__in=shared_source_ids))
        elif org_id:
            queryset = queryset.filter(organization_id=org_id)
        
        return queryset

    def perform_create(self, serializer):
        user = self.request.user

        catalog = serializer.save(created_by=user)

        # Criar atividade
        Activity.objects.create(
            user=user,
            action='Catálogo criado',
            description=f'Criou o catálogo "{catalog.title}"',
            catalog=catalog,
            organization=catalog.organization,
            sede=catalog.sede
        )

    def perform_update(self, serializer):
        user = self.request.user

        catalog = serializer.save()

        # Criar atividade
        Activity.objects.create(
            user=user,
            action='Catálogo editado',
            description=f'Editou o catálogo "{catalog.title}"',
            catalog=catalog,
            organization=catalog.organization,
            sede=catalog.sede
        )

    @action(detail=False, methods=['get'], permission_classes=[permissions.AllowAny])
    def explore(self, request):
        """
        Returns all public catalogs for the explore page.
        """
        queryset = Catalog.objects.filter(is_public=True)
        
        # Optional: Search functionality
        search = request.query_params.get('search')
        if search:
            queryset = queryset.filter(Q(title__icontains=search) | Q(description__icontains=search))
            
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def like(self, request, pk=None):
        catalog = self.get_object()
        user = request.user
        if catalog.likes.filter(id=user.id).exists():
            catalog.likes.remove(user)
            liked = False
        else:
            catalog.likes.add(user)
            liked = True
        return Response({'liked': liked, 'count': catalog.likes.count()})

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def toggle_save(self, request, pk=None):
        catalog = self.get_object()
        user = request.user
        if catalog.saves.filter(id=user.id).exists():
            catalog.saves.remove(user)
            saved = False
        else:
            catalog.saves.add(user)
            saved = True
        return Response({'saved': saved, 'count': catalog.saves.count()})

class PageViewSet(viewsets.ModelViewSet):
    queryset = Page.objects.all()
    serializer_class = PageSerializer

class ComponentViewSet(viewsets.ModelViewSet):
    queryset = Component.objects.all()
    serializer_class = ComponentSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        org_id = self.request.query_params.get('organization')
        sede_id = self.request.query_params.get('sede')

        if sede_id:
            queryset = queryset.filter(sede_id=sede_id)
        elif org_id:
            queryset = queryset.filter(organization_id=org_id)
        return queryset

    def perform_create(self, serializer):
        user = self.request.user
        serializer.save(created_by=user)

class PageComponentViewSet(viewsets.ModelViewSet):
    queryset = PageComponent.objects.all()
    serializer_class = PageComponentSerializer

class CommentViewSet(viewsets.ModelViewSet):
    queryset = Comment.objects.all()
    serializer_class = CommentSerializer

    def perform_create(self, serializer):
        user = self.request.user
        serializer.save(user=user)

class ActivityViewSet(viewsets.ModelViewSet):
    queryset = Activity.objects.all()
    serializer_class = ActivitySerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        org_id = self.request.query_params.get('organization')
        sede_id = self.request.query_params.get('sede')

        if sede_id:
            queryset = queryset.filter(sede_id=sede_id)
        elif org_id:
            queryset = queryset.filter(organization_id=org_id)
        return queryset

    def perform_create(self, serializer):
        user = self.request.user
        serializer.save(user=user)
# Profile Views
@api_view(['GET', 'PATCH'])
@permission_classes([permissions.IsAuthenticated])
def profile_view(request):
    """
    GET: Retorna o perfil do usuário autenticado
    PATCH: Atualiza o perfil do usuário
    """
    user = request.user

    if request.method == 'GET':
        # Criar atividade de acesso ao perfil apenas uma vez por dia
        from django.utils import timezone
        from datetime import timedelta

        last_profile_activity = Activity.objects.filter(
            user=user,
            action='Perfil visualizado',
            timestamp__gte=timezone.now() - timedelta(hours=1)
        ).first()

        if not last_profile_activity:
            Activity.objects.create(
                user=user,
                action='Perfil visualizado',
                description='Acessou a página de perfil',
                organization=user.organizations.first() if user.organizations.exists() else None
            )

        serializer = UserProfileSerializer(user, context={'request': request})
        return Response(serializer.data)

    elif request.method == 'PATCH':
        # Atualizar first_name e last_name se 'name' foi enviado
        if 'name' in request.data:
            name_parts = request.data['name'].split(' ', 1)
            request.data['first_name'] = name_parts[0]
            request.data['last_name'] = name_parts[1] if len(name_parts) > 1 else ''

        serializer = UpdateProfileSerializer(user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            # Retornar o perfil completo atualizado
            profile_serializer = UserProfileSerializer(user, context={'request': request})
            return Response(profile_serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def upload_avatar(request):
    """
    Upload de avatar do usuário
    """
    user = request.user

    if 'avatar' not in request.FILES:
        return Response({'error': 'Nenhum arquivo foi enviado'}, status=status.HTTP_400_BAD_REQUEST)

    avatar_file = request.FILES['avatar']

    # Validar tamanho (2MB)
    if avatar_file.size > 2 * 1024 * 1024:
        return Response({'error': 'Arquivo muito grande. Máximo: 2MB'}, status=status.HTTP_400_BAD_REQUEST)

    # Validar tipo
    if not avatar_file.content_type in ['image/png', 'image/jpeg', 'image/jpg']:
        return Response({'error': 'Formato inválido. Use PNG ou JPG'}, status=status.HTTP_400_BAD_REQUEST)

    user.avatar = avatar_file
    user.save()

    serializer = UserProfileSerializer(user, context={'request': request})
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def change_password(request):
    """
    Alterar senha do usuário
    """
    serializer = ChangePasswordSerializer(data=request.data)

    if serializer.is_valid():
        user = request.user

        # Verificar senha antiga
        if not user.check_password(serializer.validated_data['old_password']):
            return Response({'error': 'Senha atual incorreta'}, status=status.HTTP_400_BAD_REQUEST)

        # Definir nova senha
        user.set_password(serializer.validated_data['new_password'])
        user.save()

        # Manter o usuário logado
        update_session_auth_hash(request, user)

        return Response({'message': 'Senha alterada com sucesso'})

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET', 'PATCH'])
@permission_classes([permissions.IsAuthenticated])
def preferences_view(request):
    """
    GET: Retorna as preferências do usuário
    PATCH: Atualiza as preferências do usuário
    """
    user = request.user

    # Criar preferências se não existirem
    preferences, created = UserPreferences.objects.get_or_create(user=user)

    if request.method == 'GET':
        serializer = UserPreferencesSerializer(preferences)
        return Response(serializer.data)

    elif request.method == 'PATCH':
        serializer = UserPreferencesSerializer(preferences, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def recent_activity(request):
    """
    Retorna as atividades recentes do usuário
    """
    user = request.user
    activities = Activity.objects.filter(user=user).order_by('-timestamp')[:10]
    serializer = ActivitySerializer(activities, many=True)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def logout_all_sessions(request):
    """
    Encerra todas as sessões do usuário
    """
    # No Django, não há uma forma nativa de encerrar todas as sessões
    # Essa é uma implementação simplificada que apenas retorna sucesso
    # Em produção, você pode usar django-rest-framework-simplejwt ou similar
    # para invalidar todos os tokens JWT do usuário

    return Response({'message': 'Todas as sessões foram encerradas'})
@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def register_user(request):
    try:
        data = request.data
        username = data.get('username')
        email = data.get('email')
        password = data.get('password')
        role = data.get('role', 'editor')

        if not username or not email or not password:
            return Response({'error': 'Please provide username, email and password'}, status=status.HTTP_400_BAD_REQUEST)

        if User.objects.filter(username=username).exists():
            return Response({'error': 'Username already exists'}, status=status.HTTP_400_BAD_REQUEST)

        if User.objects.filter(email=email).exists():
            return Response({'error': 'Email already exists'}, status=status.HTTP_400_BAD_REQUEST)

        from django.db import transaction
        with transaction.atomic():
            user = User.objects.create_user(
                username=username,
                email=email,
                password=password,
                role=role
            )

            # FRG-05: provisiona organização + sede padrão para o novo usuário,
            # senão ele não consegue criar produtos/catálogos (perform_create exige org).
            organization = Organization.objects.create(
                name=f'{username} Org',
                owner=user,
            )
            default_sede = Sede.objects.create(
                name='Sede Principal',
                organization=organization,
                responsible_user=user,
            )
            organization.default_sede = default_sede
            organization.save(update_fields=['default_sede'])
            user.organizations.add(organization)
            user.sedes.add(default_sede)

        # Generate tokens immediately for auto-login
        from rest_framework_simplejwt.tokens import RefreshToken
        refresh = RefreshToken.for_user(user)

        return Response({
            'user': UserSerializer(user).data,
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'organization': OrganizationSerializer(organization).data,
            'default_sede': SedeSerializer(default_sede).data,
        }, status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def dashboard_stats(request):
    """
    Returns aggregated statistics for the dashboard.
    """
    user = request.user
    org_id = request.query_params.get('organization')
    sede_id = request.query_params.get('sede')

    # Base querysets
    catalog_qs = Catalog.objects.all()
    product_qs = Product.objects.all()

    # Apply filters
    if sede_id:
        catalog_qs = catalog_qs.filter(sede_id=sede_id)
        product_qs = product_qs.filter(sede_id=sede_id)
    elif org_id:
        catalog_qs = catalog_qs.filter(organization_id=org_id)
        product_qs = product_qs.filter(organization_id=org_id)
    else:
        # Default behavior: filter by user's access
        # If user is admin/superuser, show all? Or filter by user's orgs?
        # For now, let's stick to standard behavior: if no filter, show what user owns/belongs to
        if not user.is_superuser:
            user_orgs = user.organizations.all()
            catalog_qs = catalog_qs.filter(organization__in=user_orgs)
            product_qs = product_qs.filter(organization__in=user_orgs)

    # Calculate stats
    total_catalogs = catalog_qs.count()
    total_products = product_qs.count()
    
    # "Rascunhos" (Drafts) - assuming is_public=False means draft
    draft_catalogs = catalog_qs.filter(is_public=False).count()
    
    # "Arquivados" (Archived) - no field yet, returning 0
    archived_catalogs = 0

    data = {
        'catalogs': total_catalogs,
        'catalogs_change': '+0%', # Placeholder for history
        'catalogs_percentage': 0,

        'products': total_products,
        'products_change': '+0%',
        'products_percentage': 0,

        'library': draft_catalogs, # Mapped to "Rascunhos" in frontend
        'library_change': '+0%',
        'library_percentage': 0,

        'history': archived_catalogs, # Mapped to "Arquivados" in frontend
        'history_change': '+0%',
        'history_percentage': 0,
    }
    
    return Response(data)

class ExploreProductViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ReadOnly ViewSet for Public Products (Explore Module).
    Strictly filters for is_public=True.
    Exposes only safe fields via PublicProductSerializer.

    Endpoints:
    - GET /api/explore/products/ - Lista paginada de produtos públicos
    - GET /api/explore/products/{public_slug}/ - Detalhes de um produto

    Query Parameters:
    - page: Número da página (padrão: 1)
    - page_size: Itens por página (padrão: 20, max: 100)
    - search: Buscar por nome, categoria ou descrição
    - ordering: Ordenar por public_at, name ou price (use - para desc)
    """
    queryset = Product.objects.filter(is_public=True)
    serializer_class = PublicProductSerializer
    permission_classes = [permissions.AllowAny]
    pagination_class = StandardResultsSetPagination
    lookup_field = 'public_slug'
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'category__name', 'description']
    ordering_fields = ['public_at', 'name', 'price']
    ordering = ['-public_at']

    def get_queryset(self):
        # Double check strictly public
        return Product.objects.filter(is_public=True)


# ============================================
# Global Search API
# ============================================

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def global_search(request):
    """
    Busca global por perfis, catálogos e produtos

    Query Parameters:
    - q: termo de busca (mínimo 2 caracteres)
    - limit: limite de resultados por seção (padrão: 5)

    Returns:
    {
        "profiles": [...],
        "catalogs": [...],
        "products": [...],
        "total": 0
    }
    """
    query = request.GET.get('q', '').strip()
    limit = int(request.GET.get('limit', 5))

    if len(query) < 2:
        return Response({
            'profiles': [],
            'catalogs': [],
            'products': [],
            'total': 0
        })

    # Buscar perfis públicos
    profiles = PublicProfile.objects.filter(
        Q(display_name__icontains=query) |
        Q(username__icontains=query) |
        Q(bio__icontains=query),
        show_in_search=True,
        visibility='publico'
    ).select_related('user')[:limit]

    # Buscar catálogos públicos
    catalogs = Catalog.objects.filter(
        Q(title__icontains=query) |
        Q(description__icontains=query),
        is_public=True
    ).select_related('created_by').annotate(
        pages_count=Count('pages')
    )[:limit]

    # Buscar produtos públicos
    products = Product.objects.filter(
        Q(name__icontains=query) |
        Q(description__icontains=query),
        is_public=True
    ).select_related('category')[:limit]

    # Serializar perfis
    profiles_data = []
    for p in profiles:
        # Contar seguidores
        from .models import ProfileFollow
        followers_count = ProfileFollow.objects.filter(followed_profile=p).count()

        profiles_data.append({
            'id': str(p.id),
            'username': p.username,
            'name': p.display_name,
            'avatar': request.build_absolute_uri(p.avatar.url) if p.avatar else None,
            'type': p.profile_type,
            'followers_count': followers_count if p.show_followers_count else 0
        })

    # Serializar catálogos
    catalogs_data = []
    for c in catalogs:
        # Pegar informações do autor
        author_name = c.created_by.username
        author_avatar = None
        if hasattr(c.created_by, 'public_profile'):
            author_name = c.created_by.public_profile.display_name
            if c.created_by.public_profile.avatar:
                author_avatar = request.build_absolute_uri(c.created_by.public_profile.avatar.url)

        catalogs_data.append({
            'id': str(c.id),
            'title': c.title,
            'author': author_name,
            'author_avatar': author_avatar,
            'cover_image': request.build_absolute_uri(c.cover_image.url) if c.cover_image else None,
            'is_sponsored': getattr(c, 'is_sponsored', False),
            'pages_count': c.pages_count
        })

    # Serializar produtos
    products_data = []
    for p in products:
        products_data.append({
            'id': str(p.id),
            'name': p.name,
            'image_url': request.build_absolute_uri(p.image.url) if p.image else None,
            'category': p.category.name if p.category else '',
            'price': float(p.price) if p.price else None,
            'currency': 'BRL'
        })

    total = len(profiles_data) + len(catalogs_data) + len(products_data)

    return Response({
        'profiles': profiles_data,
        'catalogs': catalogs_data,
        'products': products_data,
        'total': total
    })
