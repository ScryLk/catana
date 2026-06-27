/**
 * Componente de Feedback de Validação
 *
 * Exibe erros, avisos e sugestões de forma visual e humanizada
 */

import { type FC, useState } from 'react';
import { FiAlertTriangle, FiAlertCircle, FiInfo, FiCheckCircle, FiChevronDown, FiChevronUp, FiTool } from 'react-icons/fi';
import type { ValidationReport, ValidationIssue } from '../../services/intelligentValidator.service';

interface ValidationFeedbackProps {
  report: ValidationReport;
  onApplyFixes?: () => void;
  onCancel?: () => void;
  onProceed?: () => void;
  showActions?: boolean;
}

export const ValidationFeedback: FC<ValidationFeedbackProps> = ({
  report,
  onApplyFixes,
  onCancel,
  onProceed,
  showActions = true
}) => {
  const [expandedIssues, setExpandedIssues] = useState<Set<string>>(new Set());
  const [showTechnical, setShowTechnical] = useState(false);

  const toggleIssue = (issueId: string) => {
    const newExpanded = new Set(expandedIssues);
    if (newExpanded.has(issueId)) {
      newExpanded.delete(issueId);
    } else {
      newExpanded.add(issueId);
    }
    setExpandedIssues(newExpanded);
  };

  const getSeverityIcon = (severity: ValidationIssue['severity']) => {
    switch (severity) {
      case 'critical':
        return <FiAlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />;
      case 'warning':
        return <FiAlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />;
      case 'info':
        return <FiInfo className="w-5 h-5 text-blue-600 dark:text-blue-400" />;
    }
  };

  const getSeverityStyles = (severity: ValidationIssue['severity']) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800';
      case 'warning':
        return 'bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-800';
      case 'info':
        return 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800';
    }
  };

  if (report.valid) {
    return (
      <div className="rounded-xl bg-green-50 dark:bg-green-950/30 border-2 border-green-200 dark:border-green-800 p-6">
        <div className="flex items-start gap-4">
          <FiCheckCircle className="w-6 h-6 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-green-900 dark:text-green-100 mb-1">
              Catálogo perfeito!
            </h3>
            <p className="text-green-700 dark:text-green-300">
              Seu catálogo está pronto para ser importado. Todas as regras de layout profissional foram seguidas.
            </p>
          </div>
        </div>

        {showActions && onProceed && (
          <div className="mt-6 flex justify-end">
            <button
              onClick={onProceed}
              className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors"
            >
              Importar Catálogo
            </button>
          </div>
        )}
      </div>
    );
  }

  const criticalIssues = report.issues.filter(i => i.severity === 'critical');
  const warningIssues = report.issues.filter(i => i.severity === 'warning');
  const infoIssues = report.issues.filter(i => i.severity === 'info');

  return (
    <div className="space-y-4">
      {/* Cabeçalho de Status */}
      <div className={`rounded-xl border-2 p-6 ${!report.canProceed ? getSeverityStyles('critical') : getSeverityStyles('warning')}`}>
        <div className="flex items-start gap-4">
          {getSeverityIcon(!report.canProceed ? 'critical' : 'warning')}
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-2">
              {!report.canProceed ? 'Não é possível importar' : 'Avisos detectados'}
            </h3>
            <p className="text-sm mb-4">
              {!report.canProceed
                ? 'Encontramos problemas críticos que impedem a importação. Veja os detalhes abaixo.'
                : 'Seu catálogo pode ser importado, mas recomendamos revisar os avisos para garantir um layout profissional.'}
            </p>

            <div className="flex items-center gap-6 text-sm">
              {report.stats.critical > 0 && (
                <div className="flex items-center gap-2">
                  <FiAlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                  <span className="font-medium">{report.stats.critical} crítico(s)</span>
                </div>
              )}
              {report.stats.warnings > 0 && (
                <div className="flex items-center gap-2">
                  <FiAlertTriangle className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                  <span className="font-medium">{report.stats.warnings} aviso(s)</span>
                </div>
              )}
              {report.stats.info > 0 && (
                <div className="flex items-center gap-2">
                  <FiInfo className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span className="font-medium">{report.stats.info} informativo(s)</span>
                </div>
              )}
            </div>

            {report.stats.autoFixable > 0 && (
              <div className="mt-4 p-3 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-700">
                <div className="flex items-center gap-2 text-sm">
                  <FiTool className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                  <span className="font-medium text-primary-700 dark:text-primary-300">
                    {report.stats.autoFixable} problema(s) pode(m) ser corrigido(s) automaticamente
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Lista de Problemas Críticos */}
      {criticalIssues.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 px-1">
            Problemas Críticos
          </h4>
          {criticalIssues.map(issue => (
            <div
              key={issue.id}
              className={`rounded-lg border-2 ${getSeverityStyles(issue.severity)} overflow-hidden`}
            >
              <button
                onClick={() => toggleIssue(issue.id)}
                className="w-full p-4 text-left hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              >
                <div className="flex items-start gap-3">
                  {getSeverityIcon(issue.severity)}
                  <div className="flex-1 min-w-0">
                    <h5 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
                      {issue.title}
                    </h5>
                    <p className="text-sm text-zinc-700 dark:text-zinc-300">
                      {issue.message}
                    </p>
                    {issue.location && (
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                        Página {(issue.location.page ?? 0) + 1}
                        {issue.location.element !== undefined && `, Elemento ${issue.location.element + 1}`}
                      </p>
                    )}
                  </div>
                  {expandedIssues.has(issue.id) ? (
                    <FiChevronUp className="w-5 h-5 text-zinc-400 flex-shrink-0" />
                  ) : (
                    <FiChevronDown className="w-5 h-5 text-zinc-400 flex-shrink-0" />
                  )}
                </div>
              </button>

              {expandedIssues.has(issue.id) && (
                <div className="px-4 pb-4 border-t border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900">
                  <div className="pt-4 space-y-3">
                    {issue.suggestion && (
                      <div className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
                        <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                          💡 Sugestão:
                        </p>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400">
                          {issue.suggestion}
                        </p>
                      </div>
                    )}

                    {issue.autoFixable && (
                      <div className="p-3 bg-primary-50 dark:bg-primary-950/30 rounded-lg border border-primary-200 dark:border-primary-800">
                        <p className="text-sm text-primary-700 dark:text-primary-300">
                          ✨ Este problema pode ser corrigido automaticamente
                        </p>
                      </div>
                    )}

                    {showTechnical && issue.technicalDetails && (
                      <details className="text-xs text-zinc-500 dark:text-zinc-400">
                        <summary className="cursor-pointer">Detalhes técnicos</summary>
                        <pre className="mt-2 p-2 bg-zinc-100 dark:bg-zinc-800 rounded overflow-x-auto">
                          {issue.technicalDetails}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Lista de Avisos */}
      {warningIssues.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 px-1">
            Avisos
          </h4>
          {warningIssues.slice(0, 5).map(issue => (
            <div
              key={issue.id}
              className={`rounded-lg border-2 ${getSeverityStyles(issue.severity)} p-4`}
            >
              <div className="flex items-start gap-3">
                {getSeverityIcon(issue.severity)}
                <div className="flex-1 min-w-0">
                  <h5 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
                    {issue.title}
                  </h5>
                  <p className="text-sm text-zinc-700 dark:text-zinc-300">
                    {issue.message}
                  </p>
                </div>
              </div>
            </div>
          ))}
          {warningIssues.length > 5 && (
            <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center py-2">
              ... e mais {warningIssues.length - 5} aviso(s)
            </p>
          )}
        </div>
      )}

      {/* Ações */}
      {showActions && (
        <div className="flex items-center justify-between gap-4 pt-4 border-t border-zinc-200 dark:border-zinc-700">
          <button
            onClick={() => setShowTechnical(!showTechnical)}
            className="text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
          >
            {showTechnical ? 'Ocultar' : 'Mostrar'} detalhes técnicos
          </button>

          <div className="flex items-center gap-3">
            {onCancel && (
              <button
                onClick={onCancel}
                className="px-6 py-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-lg font-semibold hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
              >
                Cancelar
              </button>
            )}

            {report.stats.autoFixable > 0 && onApplyFixes && (
              <button
                onClick={onApplyFixes}
                className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-semibold transition-colors flex items-center gap-2"
              >
                <FiTool className="w-4 h-4" />
                Aplicar Correções Automáticas
              </button>
            )}

            {report.canProceed && onProceed && (
              <button
                onClick={onProceed}
                className="px-6 py-3 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg font-semibold hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
              >
                Importar Mesmo Assim
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
