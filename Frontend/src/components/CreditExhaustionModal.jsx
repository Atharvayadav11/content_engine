import { X, AlertTriangle, CreditCard } from 'lucide-react'

const CreditExhaustionModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <AlertTriangle className="text-red-600 mr-2" size={24} />
            Credits Exhausted
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start">
              <CreditCard className="text-red-600 mr-3 mt-0.5" size={20} />
              <div className="text-sm text-red-800">
                <p className="font-medium mb-1">No Blog Credits Remaining</p>
                <p>You've used all your free blog creation credits. Each user gets 2 free blogs to start with.</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="font-medium text-gray-900">What you can still do for FREE:</h3>
            <ul className="text-sm text-gray-600 space-y-1 ml-4">
              <li>• View and manage your existing blogs</li>
              <li>• Access all blog details and content</li>
              <li>• Copy generated content from previous blogs</li>
              <li>• Export your blog data</li>
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className="font-medium text-gray-900">To create more blogs:</h3>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                <strong>Upgrade to Premium</strong> - Get unlimited blog creation for just $5 per blog credit.
              </p>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-xs text-yellow-800">
              <strong>Note:</strong> Credits are never refunded, even if you delete blogs. Each credit represents one blog creation workflow.
            </p>
          </div>
        </div>

        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            I Understand
          </button>
          <button
            onClick={() => {
              // Future: Open upgrade modal
              onClose()
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Upgrade Now
          </button>
        </div>
      </div>
    </div>
  )
}

export default CreditExhaustionModal

