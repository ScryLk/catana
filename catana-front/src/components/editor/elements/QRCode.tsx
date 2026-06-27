/**
 * 📱 QR Code Component
 *
 * Componente profissional de QR Code para o editor Catana
 * Conecta o físico ao digital com QR Codes personalizáveis e rastreáveis
 *
 * Suporta:
 * - 4 tipos de destino: catalog, product, profile, url
 * - Personalização visual completa
 * - Logo central customizável
 * - Tracking de scans (quando habilitado)
 * - Exportação em alta qualidade
 */

import { type FC, useMemo } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { type QRCodeData } from '../../../types/editor';
import { AlertCircle, Eye } from 'lucide-react';

interface QRCodeProps {
  data: QRCodeData;
  size?: { width: number; height: number };
  isSelected?: boolean;
  onSelect?: () => void;
  isPDF?: boolean; // Para exportação de PDF
}

export const QRCode: FC<QRCodeProps> = ({
  data,
  size = { width: 200, height: 200 },
  onSelect,
  isPDF = false,
}) => {
  /**
   * Gera a URL final baseado no tipo de destino
   */
  const finalUrl = useMemo(() => {
    if (!data) return 'https://catana.app';

    // Se já tem data preenchido, usar esse valor
    if (data.data && data.data.trim() !== '') {
      return data.data;
    }

    // Caso contrário, gerar baseado no destinationType
    const baseUrl = window.location.origin;

    switch (data.destinationType) {
      case 'catalog':
        return data.catalogId
          ? `${baseUrl}/catalog/${data.catalogId}`
          : `${baseUrl}/catalogs`;

      case 'product':
        return data.productId
          ? `${baseUrl}/product/${data.productId}`
          : `${baseUrl}/products`;

      case 'profile':
        return data.profileId
          ? `${baseUrl}/profile/${data.profileId}`
          : `${baseUrl}/profiles`;

      case 'url':
        return data.customUrl || 'https://catana.app';

      default:
        return 'https://catana.app';
    }
  }, [data]);

  /**
   * Valida se é uma URL válida e segura
   */
  const isValidUrl = (string: string) => {
    try {
      const url = new URL(string);
      // Apenas permitir protocolos HTTP e HTTPS
      if (!['http:', 'https:'].includes(url.protocol)) {
        return false;
      }
      return true;
    } catch {
      return false;
    }
  };

  /**
   * Detecta se a URL aponta para um recurso potencialmente privado
   */
  const isPrivateDestination = useMemo(() => {
    if (!data) return false;

    // URLs customizadas que apontam para localhost ou IPs privados
    if (data.destinationType === 'url' && data.customUrl) {
      try {
        const url = new URL(data.customUrl);
        const hostname = url.hostname.toLowerCase();

        // Detectar localhost
        if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1') {
          return true;
        }

        // Detectar IPs privados (10.x.x.x, 192.168.x.x, 172.16-31.x.x)
        if (hostname.startsWith('10.') || hostname.startsWith('192.168.') || /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostname)) {
          return true;
        }
      } catch {
        return false;
      }
    }

    return false;
  }, [data]);

  // Verificar se QR Code está configurado corretamente
  const isConfigured = useMemo(() => {
    if (!data) return false;

    // URL customizada: deve ter customUrl válida
    if (data.destinationType === 'url') {
      return !!data.customUrl && isValidUrl(data.customUrl);
    }

    // Outros tipos: devem ter o ID correspondente
    if (data.destinationType === 'catalog') return !!data.catalogId;
    if (data.destinationType === 'product') return !!data.productId;
    if (data.destinationType === 'profile') return !!data.profileId;

    return false;
  }, [data]);

  // Calcular tamanho do QR Code baseado no container e margens
  const margin = data?.margin ?? 4;
  const qualityMultiplier = data?.quality === 'high' ? 1.5 : data?.quality === 'low' ? 0.8 : 1;
  const baseQrSize = Math.min(size.width, size.height) * 0.7;
  const qrSize = Math.max(50, baseQrSize * qualityMultiplier);

  // Tamanho do logo (padrão: 20% do QR code, ou customizado)
  const logoSize = data?.logoSize ?? qrSize * 0.2;

  return (
    <div
      className="w-full h-full flex flex-col items-center justify-center relative"
      style={{
        backgroundColor: data?.backgroundColor || '#FFFFFF',
      }}
      onClick={onSelect}
    >
      {/* Badge de aviso se não configurado */}
      {!isConfigured && !isPDF && (
        <div className="absolute top-2 right-2 z-10">
          <div className="bg-yellow-500 text-white rounded-full p-1" title="QR Code não configurado">
            <AlertCircle className="w-4 h-4" />
          </div>
        </div>
      )}

      {/* Badge de aviso para destinos privados */}
      {isPrivateDestination && !isPDF && (
        <div className="absolute top-8 right-2 z-10">
          <div className="bg-red-500 text-white rounded-full p-1" title="⚠️ Destino privado detectado! Este QR Code não funcionará publicamente.">
            <AlertCircle className="w-4 h-4" />
          </div>
        </div>
      )}

      {/* Badge de tracking (se habilitado) */}
      {data?.trackScans && !isPDF && (
        <div className="absolute top-2 left-2 z-10">
          <div className="bg-blue-500 text-white rounded-full p-1" title="Tracking de scans habilitado">
            <Eye className="w-4 h-4" />
          </div>
        </div>
      )}

      {/* QR Code SVG */}
      <div className="relative flex items-center justify-center">
        <QRCodeSVG
          value={finalUrl}
          size={qrSize}
          bgColor={data?.backgroundColor || '#FFFFFF'}
          fgColor={data?.color || '#000000'}
          level={data?.errorCorrection || 'M'}
          includeMargin={false}
          marginSize={margin}
        />

        {/* Logo overlay no centro do QR Code */}
        {data?.logo && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <div
              className="bg-white rounded-lg shadow-lg border border-gray-200 flex items-center justify-center"
              style={{
                width: logoSize,
                height: logoSize,
                padding: logoSize * 0.1,
              }}
            >
              <img
                src={data.logo}
                alt="Logo"
                className="w-full h-full object-contain"
                onError={(e) => {
                  // Esconder logo se não carregar
                  e.currentTarget.parentElement!.style.display = 'none';
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Label descritivo (se houver espaço e label definido) */}
      {data?.label && size.height > 220 && (
        <div className="mt-3 w-full px-2">
          <p className="text-center text-sm font-medium text-gray-700 truncate">
            {data.label}
          </p>
        </div>
      )}

      {/* Info da URL (só mostra se houver espaço suficiente) */}
      {size.height > 250 && !data?.label && (
        <div className="mt-2 w-full px-2">
          {!isConfigured ? (
            <div className="text-center">
              <p className="text-xs text-yellow-600 font-medium">
                ⚠️ Configure o destino do QR Code
              </p>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-xs text-gray-600 truncate" title={finalUrl}>
                {data.destinationType === 'catalog' && '📚 '}
                {data.destinationType === 'product' && '📦 '}
                {data.destinationType === 'profile' && '👤 '}
                {data.destinationType === 'url' && '🔗 '}
                {finalUrl}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
