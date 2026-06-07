import { Modal } from './Modal'
import { Button } from './Button'
import { useTranslation } from '../../hooks/useTranslation'

interface ConfirmDialogProps {
  open: boolean
  title: string
  message: string
  onConfirm: () => void
  onCancel: () => void
}

/**
 * window.confirm yerine kullanılır: Electron'da native onay diyaloğu, pencere
 * odağını bozarak ardından açılan formların input alanlarının yazılamaz hale
 * gelmesine yol açıyordu. Bu bileşen tamamen React içinde render edildiği için
 * bu odak sorununu ortadan kaldırır.
 */
export function ConfirmDialog({ open, title, message, onConfirm, onCancel }: ConfirmDialogProps) {
  const { t } = useTranslation()

  return (
    <Modal open={open} onClose={onCancel} title={title} width="sm">
      <div className="space-y-4">
        <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-line">{message}</p>
        <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 dark:border-gray-700">
          <Button variant="secondary" onClick={onCancel}>{t.common.cancel}</Button>
          <Button variant="danger" onClick={onConfirm}>{t.common.confirmDelete}</Button>
        </div>
      </div>
    </Modal>
  )
}
