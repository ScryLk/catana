import type { FC } from 'react';
import { useState, useRef, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { MediaPicker } from '../../../components/media/MediaPicker';
import type { Media } from '../../../types/api';

interface ProductData {
  id: number;
  code: string;
  description: string;
  internalDimensions: string;
  externalDimensions: string;
  unitsPerBox: string;
  imageUrl?: string;
  scale?: number; // Escala do produto (0.5 a 2.0)
  isNew?: boolean; // Se o produto é novo
  badgeText?: string; // Texto customizado do badge (ex: "NEW", "PROMO", "50% OFF")
  badgeColor?: string; // Cor customizada do badge (hex)
  x?: number; // Posição X livre no template
  y?: number; // Posição Y livre no template
}

interface DiPackShowcaseProps {
  width?: number;
  height?: number;
  lineTitle?: string;
  productCount?: number;
  products?: ProductData[];
  onLineTitleChange?: (newTitle: string) => void;
  onProductChange?: (productId: number, field: keyof ProductData, value: string) => void;
  onImageUpload?: (productId: number, file: File) => void;
  onProductsReorder?: (newProducts: ProductData[]) => void;
  onProductDelete?: (productId: number) => void;
  onProductDuplicate?: (productId: number) => void;
  isEditable?: boolean;
}

/**
 * Componente de Página de Mostruário para DiPACK Embalagens
 * Grid com espaços para produtos (6 itens por página)
 */
export const DiPackShowcase: FC<DiPackShowcaseProps> = ({
  width = 800,
  height = 1130,
  lineTitle = 'Linha Exibição',
  productCount = 24,
  products: productsProp,
  onLineTitleChange,
  onProductChange,

  onProductsReorder,
  onProductDelete,
  onProductDuplicate,
  isEditable = false
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(lineTitle);
  const [editingField, setEditingField] = useState<{ productId: number; field: string } | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);
  const [selectedProductIdForImage, setSelectedProductIdForImage] = useState<number | null>(null);
  const [draggingProduct, setDraggingProduct] = useState<{ id: number; startX: number; startY: number; offsetX: number; offsetY: number } | null>(null);
  const [editingBadge, setEditingBadge] = useState<number | null>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Configurar sensores para drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px movement to start dragging (permite cliques normais)
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    setEditedTitle(lineTitle);
  }, [lineTitle]);

  useEffect(() => {
    if (isEditing && titleRef.current) {
      titleRef.current.focus();
      // Selecionar todo o texto
      const range = document.createRange();
      range.selectNodeContents(titleRef.current);
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
    }
  }, [isEditing]);

  // Mouse event listeners para drag livre
  useEffect(() => {
    if (!draggingProduct) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!draggingProduct || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left - draggingProduct.offsetX;
      const y = e.clientY - rect.top - draggingProduct.offsetY;

      if (onProductChange) {
        onProductChange(draggingProduct.id, 'x' as any, x.toString());
        onProductChange(draggingProduct.id, 'y' as any, y.toString());
      }
    };

    const handleMouseUp = () => {
      setDraggingProduct(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggingProduct, onProductChange]);

  const handleDoubleClick = (e: React.MouseEvent) => {
    if (isEditable) {
      e.stopPropagation();
      e.preventDefault();
      setIsEditing(true);
    }
  };

  const handleBlur = () => {
    setIsEditing(false);
    if (onLineTitleChange && editedTitle !== lineTitle) {
      onLineTitleChange(editedTitle);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      titleRef.current?.blur();
    }
    if (e.key === 'Escape') {
      setEditedTitle(lineTitle);
      setIsEditing(false);
    }
  };
  // Usar produtos do prop ou gerar defaults
  const products: ProductData[] = productsProp || Array.from({ length: productCount }, (_, i) => ({
    id: i + 1,
    code: `REF-${String(i + 1).padStart(4, '0')}`,
    description: 'Descrição do produto',
    internalDimensions: '00 x 00 x 00 cm',
    externalDimensions: '00 x 00 x 00 cm',
    unitsPerBox: '00 unidades',
    isNew: true
  }));

  // Separar produtos em grid e posicionamento livre
  const gridProducts = products.filter(p => p.x === undefined || p.y === undefined);
  const freeProducts = products.filter(p => p.x !== undefined && p.y !== undefined);

  // Calcular número de colunas baseado na quantidade de produtos
  // Novo layout: 2 colunas fixas com cards horizontais compactos
  const gridCols = 2;

  // Handler para edição de campo de produto
  const handleProductFieldChange = (productId: number, field: keyof ProductData, value: string) => {
    if (onProductChange) {
      onProductChange(productId, field, value);
    }
  };

  // Handler para upload de imagem
  const handleImageClick = (productId: number) => {
    if (isEditable) {
      setSelectedProductIdForImage(productId);
      setIsMediaPickerOpen(true);
    }
  };

  const handleMediaSelect = (media: Media) => {
    if (selectedProductIdForImage && onProductChange) {
      onProductChange(selectedProductIdForImage, 'imageUrl', media.file_url);
    }
    setIsMediaPickerOpen(false);
    setSelectedProductIdForImage(null);
  };

  // Handler para drag and drop
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = products.findIndex((p) => p.id === active.id);
      const newIndex = products.findIndex((p) => p.id === over.id);

      const reorderedProducts = arrayMove(products, oldIndex, newIndex);

      if (onProductsReorder) {
        onProductsReorder(reorderedProducts);
      }
    }
  };

  // Handler para seleção de produto
  const handleProductSelect = (productId: number, e: React.MouseEvent) => {
    e.stopPropagation();

    // Não desselecionar se o clique foi em um controle de ação (checkbox, botões, etc)
    const target = e.target as HTMLElement;
    const isActionControl = target.closest('[data-action-control="true"]') ||
      target.closest('button') ||
      target.closest('input[type="checkbox"]') ||
      target.closest('label');

    if (isEditable && !isActionControl) {
      setSelectedProductId(selectedProductId === productId ? null : productId);
    }
  };

  // Handler para deletar produto
  const handleDelete = (productId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onProductDelete) {
      onProductDelete(productId);
      setSelectedProductId(null);
    }
  };

  // Handler para duplicar produto
  const handleDuplicate = (productId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onProductDuplicate) {
      onProductDuplicate(productId);
    }
  };

  // Handler para redimensionar produto
  const handleResize = (productId: number, delta: number) => {
    const product = products.find(p => p.id === productId);
    if (!product || !onProductChange) return;

    const currentScale = product.scale || 1;
    const newScale = Math.max(0.5, Math.min(2, currentScale + delta));

    onProductChange(productId, 'scale' as any, newScale.toString());
  };

  // Handler para iniciar drag livre
  const handleFreeDragStart = (productId: number, e: React.MouseEvent) => {
    if (!isEditable || !containerRef.current) return;
    e.stopPropagation();
    e.preventDefault();

    const rect = containerRef.current.getBoundingClientRect();
    const product = products.find(p => p.id === productId) as ProductData | undefined;

    // Se o produto já tem posição livre, usar ela, caso contrário usar posição do elemento
    let startX = product?.x ?? 0;
    let startY = product?.y ?? 0;

    // Se não tem posição ainda, calcular baseado no elemento atual
    if (product && (product.x === undefined || product.y === undefined)) {
      const target = e.currentTarget as HTMLElement;
      const cardRect = target.getBoundingClientRect();
      startX = cardRect.left - rect.left;
      startY = cardRect.top - rect.top;
    }

    const offsetX = e.clientX - rect.left - startX;
    const offsetY = e.clientY - rect.top - startY;

    setDraggingProduct({ id: productId, startX, startY, offsetX, offsetY });
  };

  // Componente de campo editável - MOVIDO PARA FORA DO MAP
  const EditableField: FC<{
    productId: number;
    field: keyof ProductData;
    value: string;
    className?: string;
    placeholder?: string;
    style?: React.CSSProperties;
  }> = ({ productId, field, value, className = '', placeholder, style }) => {
    const isFieldEditing = editingField?.productId === productId && editingField?.field === field;

    return (
      <span
        data-editable="true"
        contentEditable={isEditable && isFieldEditing}
        suppressContentEditableWarning
        onMouseDown={(e) => {
          if (isEditable) {
            e.stopPropagation();
          }
        }}
        onDoubleClick={(e) => {
          if (isEditable) {
            e.stopPropagation();
            e.preventDefault();
            setEditingField({ productId, field });
            setTimeout(() => {
              const target = e.currentTarget;
              target.focus();
              const range = document.createRange();
              range.selectNodeContents(target);
              const selection = window.getSelection();
              selection?.removeAllRanges();
              selection?.addRange(range);
            }, 0);
          }
        }}
        onBlur={(e) => {
          const newValue = e.currentTarget.textContent || '';
          if (newValue !== value) {
            handleProductFieldChange(productId, field, newValue);
          }
          setEditingField(null);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            e.currentTarget.blur();
          }
          if (e.key === 'Escape') {
            e.currentTarget.textContent = value;
            setEditingField(null);
          }
        }}
        className={`${className} outline-none ${isEditable ? 'cursor-text px-1 -mx-1' : ''
          } ${isFieldEditing ? 'ring-1 ring-orange-400' : ''}`}
        style={{
          ...style,
          backgroundColor: isFieldEditing ? '#fffbeb' : (isEditable ? 'rgba(245, 166, 35, 0.05)' : 'transparent')
        }}
      >
        {value || placeholder}
      </span>
    );
  };

  return (
    <div
      ref={containerRef}
      className="relative bg-white"
      style={{
        width: `${width}px`,
        height: `${height}px`,
        padding: '32px',
        paddingBottom: '64px',
        margin: 0,
        border: 'none',
        boxShadow: 'none'
      }}
    >

      {/* Título da linha de produtos */}
      <div className="relative mb-3">
        <div className="flex items-center gap-4">
          <div className="flex-1 flex flex-col justify-center">
            <h2
              ref={titleRef}
              data-editable="true"
              contentEditable={isEditable && isEditing}
              suppressContentEditableWarning
              onMouseDown={(e) => {
                if (isEditable) {
                  e.stopPropagation();
                }
              }}
              onDoubleClick={handleDoubleClick}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              onInput={(e) => setEditedTitle(e.currentTarget.textContent || '')}
              className={`text-2xl font-bold text-gray-900 mb-1 outline-none ${isEditable ? 'cursor-text px-2 -mx-2' : ''
                } ${isEditing ? 'px-2 -mx-2' : ''}`}
              style={isEditable ? { '--tw-ring-color': '#f5a623', backgroundColor: isEditing ? '#fffbeb' : '' } as any : {}}
            >
              {editedTitle}
            </h2>
            <div className="h-1 w-24" style={{ background: '#f5a623' }} />
          </div>
          {/* Logo DiPack - Header */}
          <div className="w-32 h-32 bg-gradient-to-br flex items-center justify-center overflow-hidden">
            <img src="/dipack2.png" alt="DiPack" className="w-28 h-28 object-contain" />
          </div>
        </div>
      </div>

      {/* Grid de produtos - dinâmico baseado na quantidade */}
      <DndContext
        sensors={isEditable ? sensors : []}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={gridProducts.map((p) => p.id)}
          strategy={verticalListSortingStrategy}
          disabled={!isEditable}
        >
          <div
            className="relative grid gap-2 mt-0"
            style={{
              gridTemplateColumns: `repeat(${gridCols}, 1fr)`,
              width: '100%'
            }}
          >
            {gridProducts.map((product) => {
              // Hook do sortable para drag and drop
              const SortableCard: FC = () => {
                const {
                  attributes,
                  listeners,
                  setNodeRef,
                  transform,
                  transition,
                  isDragging,
                } = useSortable({ id: product.id, disabled: !isEditable });

                const isSelected = selectedProductId === product.id;
                const productScale = product.scale || 1;

                const style = {
                  transform: CSS.Transform.toString(transform),
                  transition,
                  opacity: isDragging ? 0.5 : 1,
                  scale: productScale.toString(),
                  borderRadius: '16px',
                  minHeight: '90px',
                  boxSizing: 'border-box' as const,
                  overflow: 'hidden',
                  backgroundColor: '#f9fafb',
                  border: '1px solid transparent',
                  backgroundImage: 'linear-gradient(#f9fafb, #f9fafb), linear-gradient(135deg, rgba(245, 166, 35, 0.2) 0%, rgba(245, 166, 35, 0.5) 50%, #f5a623 100%)',
                  backgroundOrigin: 'border-box',
                  backgroundClip: 'padding-box, border-box',
                };

                return (
                  <div
                    ref={setNodeRef}
                    style={style}
                    onMouseDown={(e) => {
                      // Selecionar ao clicar, mas permitir que o drag funcione
                      const target = e.target as HTMLElement;
                      const isEditableElement = target.isContentEditable ||
                        target.closest('[contenteditable="true"]') ||
                        target.hasAttribute('data-editable') ||
                        target.closest('[data-editable="true"]');

                      // Não selecionar se clicou na área de imagem (para permitir abrir MediaPicker)
                      const isImageArea = target.closest('[data-image-area="true"]');

                      if (!isEditableElement && !isImageArea && isEditable) {
                        handleProductSelect(product.id, e);
                      }
                    }}
                    className={`relative transition-all group ${isDragging ? 'z-50 scale-105' : ''
                      } ${isSelected
                        ? 'overflow-visible shadow-md'
                        : 'shadow-sm hover:shadow-md'
                      }`}
                  >
                    {/* Ícone de movimento - canto superior esquerdo */}
                    {isSelected && isEditable && (
                      <div
                        {...attributes}
                        {...listeners}
                        onMouseDown={(e) => {
                          // Shift + Drag = posicionamento livre
                          if (e.shiftKey) {
                            handleFreeDragStart(product.id, e);
                          }
                          // Drag normal = reordenar no grid (dnd-kit cuida disso)
                        }}
                        className="absolute -top-2 -left-2 w-6 h-6 text-white flex items-center justify-center transition-colors cursor-grab active:cursor-grabbing z-10"
                        style={{ backgroundColor: '#f5a623' }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e89410'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f5a623'}
                        title="Arrastar para reordenar | Shift+Arrastar para posição livre"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                        </svg>
                      </div>
                    )}

                    {/* Botões de ação - aparecem quando selecionado */}
                    {isSelected && isEditable && (
                      <>
                        {/* Botões principais (topo direito) */}
                        <div className="absolute -top-2 -right-2 flex gap-1 z-10">
                          {/* Checkbox "Produto Novo" */}
                          <label
                            data-action-control="true"
                            className="flex items-center gap-1 bg-white border-2 border-orange-400 rounded px-1.5 py-0.5 cursor-pointer shadow-md hover:shadow-lg transition-all"
                            onMouseDown={(e) => e.stopPropagation()}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <input
                              type="checkbox"
                              checked={product.isNew ?? true}
                              onChange={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                if (onProductChange) {
                                  onProductChange(product.id, 'isNew' as any, e.target.checked.toString());
                                }
                              }}
                              onMouseDown={(e) => e.stopPropagation()}
                              onClick={(e) => e.stopPropagation()}
                              className="w-3 h-3 text-orange-500 bg-white border-gray-300 rounded focus:ring-orange-500 focus:ring-2 cursor-pointer"
                            />
                            <span className="text-[9px] font-bold text-gray-700 uppercase select-none">Novo</span>
                          </label>

                          <button
                            onClick={(e) => handleDuplicate(product.id, e)}
                            className="w-6 h-6 bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center transition-colors rounded"
                            title="Duplicar"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          </button>
                          <button
                            onClick={(e) => handleDelete(product.id, e)}
                            className="w-6 h-6 bg-red-500 hover:bg-red-600 text-white flex items-center justify-center transition-colors rounded"
                            title="Deletar"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>

                        {/* Botões de zoom (canto inferior direito) */}
                        <div className="absolute -bottom-2 -right-2 flex gap-1 z-10">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleResize(product.id, -0.1);
                            }}
                            className="w-6 h-6 bg-purple-500 hover:bg-purple-600 text-white flex items-center justify-center transition-colors font-bold"
                            title="Diminuir tamanho"
                          >
                            <span className="text-xs">-</span>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleResize(product.id, 0.1);
                            }}
                            className="w-6 h-6 bg-purple-500 hover:bg-purple-600 text-white flex items-center justify-center transition-colors font-bold"
                            title="Aumentar tamanho"
                          >
                            <span className="text-xs">+</span>
                          </button>
                        </div>

                        {/* Indicador de escala */}
                        <div className="absolute -bottom-2 -left-2 z-10">
                          <div className="bg-gray-800 text-white text-xs px-2 py-1">
                            {Math.round(productScale * 100)}%
                          </div>
                        </div>
                      </>
                    )}

                    {/* Layout Horizontal: Imagem + Informações */}
                    <div className="flex items-stretch h-full">
                      {/* Área de imagem do produto - ESQUERDA */}
                      <div
                        data-image-area="true"
                        className={`relative flex items-center justify-center transition-all flex-shrink-0 ${isEditable ? 'cursor-pointer hover:bg-gray-100' : ''
                          }`}
                        style={{
                          width: '80px',
                          borderRight: '1px solid rgba(209, 213, 219, 0.5)'
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleImageClick(product.id);
                        }}
                      >
                        {product.imageUrl ? (
                          <img
                            src={product.imageUrl}
                            alt={product.description}
                            className="w-full h-full object-contain"
                            crossOrigin="anonymous"
                          />
                        ) : (
                          <div className="text-center">
                            <div className="text-xl mb-0.5 opacity-20">📦</div>
                            <p className="text-[7px] text-gray-400 font-medium px-1">
                              {isEditable ? 'Click' : 'IMG'}
                            </p>
                          </div>
                        )}

                        {/* Badge customizável - só aparece se isNew for true */}
                        {(product.isNew ?? true) && (
                          <div
                            className="absolute top-0.5 left-0.5 text-white text-[7px] font-bold px-1 py-0.5 rounded-sm cursor-pointer hover:opacity-90 transition-opacity"
                            style={{
                              backgroundColor: product.badgeColor || '#f5a623',
                              boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                            }}
                            onClick={(e) => {
                              if (isEditable) {
                                e.stopPropagation();
                                setEditingBadge(product.id);
                              }
                            }}
                            title={isEditable ? 'Clique para editar badge' : ''}
                          >
                            {product.badgeText || 'NEW'}
                          </div>
                        )}
                      </div>

                      {/* Informações do produto - DIREITA */}
                      <div className="flex-1 p-1.5 flex flex-col justify-between min-w-0">
                        {/* Linha 1: Código + Qtd/Cx */}
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <div className="flex items-center gap-1 min-w-0 flex-1">
                            <span className="text-[8px] font-semibold text-gray-400 uppercase flex-shrink-0">REF</span>
                            <EditableField
                              productId={product.id}
                              field="code"
                              value={product.code}
                              className="text-[9px] font-bold text-gray-900 truncate"
                            />
                          </div>
                          <div className="flex items-center gap-0.5 flex-shrink-0">
                            <span className="text-[7px] text-gray-400">Cx</span>
                            <EditableField
                              productId={product.id}
                              field="unitsPerBox"
                              value={product.unitsPerBox}
                              className="text-[9px] font-bold"
                              style={{ color: '#f5a623' }}
                            />
                          </div>
                        </div>

                        {/* Linha 2: Descrição */}
                        <div className="mb-0.5">
                          <EditableField
                            productId={product.id}
                            field="description"
                            value={product.description}
                            className="text-[9px] text-gray-700 leading-tight line-clamp-2"
                          />
                        </div>

                        {/* Linha 3: Dimensões em formato compacto */}
                        <div className="flex items-center gap-2 text-[8px]">
                          <div className="flex items-center gap-0.5">
                            <span className="text-gray-400">Int:</span>
                            <EditableField
                              productId={product.id}
                              field="internalDimensions"
                              value={product.internalDimensions}
                              className="text-gray-600 font-medium"
                            />
                          </div>
                          <span className="text-gray-300">•</span>
                          <div className="flex items-center gap-0.5">
                            <span className="text-gray-400">Ext:</span>
                            <EditableField
                              productId={product.id}
                              field="externalDimensions"
                              value={product.externalDimensions}
                              className="text-gray-600 font-medium"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              };

              return <SortableCard key={product.id} />;
            })}
          </div>
        </SortableContext>
      </DndContext>

      {/* Produtos com posicionamento livre */}
      {freeProducts.map((product) => {
        const isSelected = selectedProductId === product.id;
        const productScale = product.scale || 1;
        const isDraggingThis = draggingProduct?.id === product.id;

        return (
          <div
            key={`free-${product.id}`}
            className={`absolute transition-all group ${isDraggingThis ? 'z-50 scale-105 cursor-grabbing' : 'cursor-grab'
              } ${isSelected
                ? 'overflow-visible shadow-md'
                : 'shadow-sm hover:shadow-md'
              }`}
            style={{
              left: `${product.x}px`,
              top: `${product.y}px`,
              width: '360px', // largura do card no grid (metade da largura disponível)
              borderRadius: '16px',
              minHeight: '90px',
              boxSizing: 'border-box',
              transform: `scale(${productScale})`,
              transformOrigin: 'top left',
              overflow: 'hidden',
              backgroundColor: '#f9fafb',
              border: '1px solid transparent',
              backgroundImage: 'linear-gradient(#f9fafb, #f9fafb), linear-gradient(135deg, rgba(245, 166, 35, 0.2) 0%, rgba(245, 166, 35, 0.5) 50%, #f5a623 100%)',
              backgroundOrigin: 'border-box',
              backgroundClip: 'padding-box, border-box',
            }}
            onMouseDown={(e) => {
              if (isEditable) {
                const target = e.target as HTMLElement;
                const isEditableElement = target.isContentEditable ||
                  target.closest('[contenteditable="true"]') ||
                  target.hasAttribute('data-editable') ||
                  target.closest('[data-editable="true"]');
                const isImageArea = target.closest('[data-image-area="true"]');

                if (!isEditableElement && !isImageArea) {
                  handleProductSelect(product.id, e);
                  handleFreeDragStart(product.id, e);
                }
              }
            }}
          >
            {/* Ícone de movimento - para produtos livres */}
            {isSelected && isEditable && (
              <div
                className="absolute -top-2 -left-2 w-6 h-6 text-white flex items-center justify-center transition-colors cursor-grab active:cursor-grabbing z-10"
                style={{ backgroundColor: '#f5a623' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e89410'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f5a623'}
                title="Arrastar livremente"
                onMouseDown={(e) => handleFreeDragStart(product.id, e)}
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                </svg>
              </div>
            )}

            {/* Botões de ação - aparecem quando selecionado */}
            {isSelected && isEditable && (
              <>
                {/* Botões principais (topo direito) */}
                <div className="absolute -top-2 -right-2 flex gap-1 z-10">
                  {/* Checkbox "Produto Novo" */}
                  <label
                    data-action-control="true"
                    className="flex items-center gap-1 bg-white border-2 border-orange-400 rounded px-1.5 py-0.5 cursor-pointer shadow-md hover:shadow-lg transition-all"
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="checkbox"
                      checked={product.isNew ?? true}
                      onChange={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        if (onProductChange) {
                          onProductChange(product.id, 'isNew' as any, e.target.checked.toString());
                        }
                      }}
                      onMouseDown={(e) => e.stopPropagation()}
                      onClick={(e) => e.stopPropagation()}
                      className="w-3 h-3 text-orange-500 bg-white border-gray-300 rounded focus:ring-orange-500 focus:ring-2 cursor-pointer"
                    />
                    <span className="text-[9px] font-bold text-gray-700 uppercase select-none">Novo</span>
                  </label>

                  <button
                    onClick={(e) => handleDuplicate(product.id, e)}
                    className="w-6 h-6 bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center transition-colors rounded"
                    title="Duplicar"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                  <button
                    onClick={(e) => handleDelete(product.id, e)}
                    className="w-6 h-6 bg-red-500 hover:bg-red-600 text-white flex items-center justify-center transition-colors rounded"
                    title="Deletar"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Botões de zoom (canto inferior direito) */}
                <div className="absolute -bottom-2 -right-2 flex gap-1 z-10">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleResize(product.id, -0.1);
                    }}
                    className="w-6 h-6 bg-purple-500 hover:bg-purple-600 text-white flex items-center justify-center transition-colors font-bold"
                    title="Diminuir tamanho"
                  >
                    <span className="text-xs">-</span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleResize(product.id, 0.1);
                    }}
                    className="w-6 h-6 bg-purple-500 hover:bg-purple-600 text-white flex items-center justify-center transition-colors font-bold"
                    title="Aumentar tamanho"
                  >
                    <span className="text-xs">+</span>
                  </button>
                </div>

                {/* Indicador de escala */}
                <div className="absolute -bottom-2 -left-2 z-10">
                  <div className="bg-gray-800 text-white text-xs px-2 py-1">
                    {Math.round(productScale * 100)}%
                  </div>
                </div>
              </>
            )}

            {/* Layout Horizontal: Imagem + Informações */}
            <div className="flex items-stretch h-full">
              {/* Área de imagem do produto - ESQUERDA */}
              <div
                data-image-area="true"
                className={`relative flex items-center justify-center transition-all flex-shrink-0 ${isEditable ? 'cursor-pointer hover:bg-gray-100' : ''
                  }`}
                style={{
                  width: '80px',
                  borderRight: '1px solid rgba(209, 213, 219, 0.5)'
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleImageClick(product.id);
                }}
              >
                {product.imageUrl ? (
                  <img
                    src={product.imageUrl}
                    alt={product.description}
                    className="w-full h-full object-contain"
                    crossOrigin="anonymous"
                  />
                ) : (
                  <div className="text-center">
                    <div className="text-xl mb-0.5 opacity-20">📦</div>
                    <p className="text-[7px] text-gray-400 font-medium px-1">
                      {isEditable ? 'Click' : 'IMG'}
                    </p>
                  </div>
                )}

                {/* Badge customizável - só aparece se isNew for true */}
                {(product.isNew ?? true) && (
                  <div
                    className="absolute top-0.5 left-0.5 text-white text-[7px] font-bold px-1 py-0.5 rounded-sm cursor-pointer hover:opacity-90 transition-opacity"
                    style={{
                      backgroundColor: product.badgeColor || '#f5a623',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                    }}
                    onClick={(e) => {
                      if (isEditable) {
                        e.stopPropagation();
                        setEditingBadge(product.id);
                      }
                    }}
                    title={isEditable ? 'Clique para editar badge' : ''}
                  >
                    {product.badgeText || 'NEW'}
                  </div>
                )}
              </div>

              {/* Informações do produto - DIREITA */}
              <div className="flex-1 p-1.5 flex flex-col justify-between min-w-0">
                {/* Linha 1: Código + Qtd/Cx */}
                <div className="flex items-center justify-between gap-1 mb-0.5">
                  <div className="flex items-center gap-1 min-w-0 flex-1">
                    <span className="text-[8px] font-semibold text-gray-400 uppercase flex-shrink-0">REF</span>
                    <EditableField
                      productId={product.id}
                      field="code"
                      value={product.code}
                      className="text-[9px] font-bold text-gray-900 truncate"
                    />
                  </div>
                  <div className="flex items-center gap-0.5 flex-shrink-0">
                    <span className="text-[7px] text-gray-400">Cx</span>
                    <EditableField
                      productId={product.id}
                      field="unitsPerBox"
                      value={product.unitsPerBox}
                      className="text-[9px] font-bold"
                      style={{ color: '#f5a623' }}
                    />
                  </div>
                </div>

                {/* Linha 2: Descrição */}
                <div className="mb-0.5">
                  <EditableField
                    productId={product.id}
                    field="description"
                    value={product.description}
                    className="text-[9px] text-gray-700 leading-tight line-clamp-2"
                  />
                </div>

                {/* Linha 3: Dimensões em formato compacto */}
                <div className="flex items-center gap-2 text-[8px]">
                  <div className="flex items-center gap-0.5">
                    <span className="text-gray-400">Int:</span>
                    <EditableField
                      productId={product.id}
                      field="internalDimensions"
                      value={product.internalDimensions}
                      className="text-gray-600 font-medium"
                    />
                  </div>
                  <span className="text-gray-300">•</span>
                  <div className="flex items-center gap-0.5">
                    <span className="text-gray-400">Ext:</span>
                    <EditableField
                      productId={product.id}
                      field="externalDimensions"
                      value={product.externalDimensions}
                      className="text-gray-600 font-medium"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {/* Footer com logo DiPack */}
      <div className="absolute bottom-8 left-8 right-8 flex items-center justify-between border-t border-gray-200 pt-4">
        <div className="flex items-center gap-3">
          {/* Logo DiPack - Footer (menor) */}
          <div className="flex items-center justify-center">
            <img src="/dipack2.png" alt="DiPack" className="h-12 w-auto object-contain" />
          </div>
          <div className="h-8 w-px bg-gray-300"></div>
          <span className="text-xs text-gray-500 font-medium">DiPACK Embalagens</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">www.dipackembalagens.com</span>
        </div>
      </div>
      {/* Editor de Badge */}
      {editingBadge !== null && (() => {
        const product = products.find(p => p.id === editingBadge);
        if (!product) return null;

        return (
          <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]"
            onClick={() => setEditingBadge(null)}
          >
            <div
              className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">
                  Personalizar Badge
                </h3>
                <button
                  onClick={() => setEditingBadge(null)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                {/* Preview do Badge */}
                <div className="bg-gray-50 rounded-xl p-4 flex items-center justify-center">
                  <div
                    className="text-white text-sm font-bold px-3 py-1.5 rounded-md shadow-md"
                    style={{
                      backgroundColor: product.badgeColor || '#f5a623',
                    }}
                  >
                    {product.badgeText || 'NEW'}
                  </div>
                </div>

                {/* Campo de Texto */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Texto do Badge
                  </label>
                  <input
                    type="text"
                    value={product.badgeText || 'NEW'}
                    onChange={(e) => {
                      if (onProductChange) {
                        onProductChange(editingBadge, 'badgeText' as any, e.target.value);
                      }
                    }}
                    placeholder="Ex: NEW, PROMO, 50% OFF"
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:ring-4 focus:ring-orange-500/20 outline-none transition-all"
                    maxLength={15}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Máximo 15 caracteres
                  </p>
                </div>

                {/* Seletor de Cor */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Cor do Badge
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={product.badgeColor || '#f5a623'}
                      onChange={(e) => {
                        if (onProductChange) {
                          onProductChange(editingBadge, 'badgeColor' as any, e.target.value);
                        }
                      }}
                      className="w-16 h-16 rounded-xl border-2 border-gray-200 cursor-pointer"
                    />
                    <div className="flex-1">
                      <input
                        type="text"
                        value={product.badgeColor || '#f5a623'}
                        onChange={(e) => {
                          if (onProductChange) {
                            onProductChange(editingBadge, 'badgeColor' as any, e.target.value);
                          }
                        }}
                        placeholder="#f5a623"
                        className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:ring-4 focus:ring-orange-500/20 outline-none transition-all font-mono uppercase"
                      />
                    </div>
                  </div>
                </div>

                {/* Cores Pré-definidas */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Cores Rápidas
                  </label>
                  <div className="grid grid-cols-6 gap-2">
                    {[
                      { color: '#f5a623', name: 'Laranja' },
                      { color: '#ef4444', name: 'Vermelho' },
                      { color: '#10b981', name: 'Verde' },
                      { color: '#3b82f6', name: 'Azul' },
                      { color: '#8b5cf6', name: 'Roxo' },
                      { color: '#f59e0b', name: 'Amarelo' },
                      { color: '#ec4899', name: 'Rosa' },
                      { color: '#06b6d4', name: 'Ciano' },
                      { color: '#84cc16', name: 'Lima' },
                      { color: '#f97316', name: 'Laranja Escuro' },
                      { color: '#6366f1', name: 'Índigo' },
                      { color: '#14b8a6', name: 'Teal' },
                    ].map(({ color, name }) => (
                      <button
                        key={color}
                        onClick={() => {
                          if (onProductChange) {
                            onProductChange(editingBadge, 'badgeColor' as any, color);
                          }
                        }}
                        className="w-full aspect-square rounded-lg border-2 hover:scale-110 transition-transform"
                        style={{
                          backgroundColor: color,
                          borderColor: (product.badgeColor || '#f5a623') === color ? '#1f2937' : 'transparent',
                        }}
                        title={name}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => setEditingBadge(null)}
                  className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-colors"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      <MediaPicker
        open={isMediaPickerOpen}
        onClose={() => setIsMediaPickerOpen(false)}
        onSelect={handleMediaSelect}
      />
    </div>
  );
};
