"use client"

import { useState } from "react"
import { X, Save, Eye, EyeOff, AlertCircle, CheckCircle, RefreshCw } from "lucide-react"

const WriterZenCredentialsModal = ({ isOpen, onClose, onSave, existingData, onContinue }) => {
  const [formData, setFormData] = useState({
    cookie: "",
    xsrfToken: "",
  })
  const [showCookie, setShowCookie] = useState(false)
  const [showToken, setShowToken] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showUpdateForm, setShowUpdateForm] = useState(false)

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      await onSave(formData)
      onClose()
    } catch (error) {
      console.error("Error saving credentials:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleContinue = () => {
    if (onContinue) {
      onContinue()
    }
    onClose()
  }

  const handleUpdate = () => {
    setShowUpdateForm(true)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">WriterZen Authentication</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Important Info Message */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <AlertCircle className="text-blue-600 mr-3 mt-0.5" size={20} />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Important:</p>
                <p>
                  Make sure your WriterZen cookie is updated if you experience any problems. Cookies expire regularly
                  and need to be refreshed.
                </p>
              </div>
            </div>
          </div>

          {/* Show existing credentials or update form */}
          {!showUpdateForm && existingData ? (
            <>
              {/* Existing Credentials */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center mb-3">
                  <CheckCircle className="text-green-600 mr-3" size={20} />
                  <div className="text-sm text-green-800">
                    <p className="font-medium">Existing credentials found</p>
                    <p className="text-xs mt-1">Last saved: {new Date(existingData.lastValidated).toLocaleString()}</p>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Cookie:</span>
                    <span className="ml-2 font-mono text-gray-600">{existingData.cookie}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">X-XSRF-TOKEN:</span>
                    <span className="ml-2 font-mono text-gray-600">{existingData.xsrfToken}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <button
                  onClick={handleContinue}
                  disabled={loading}
                  className="flex-1 inline-flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors font-medium"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  ) : (
                    <CheckCircle size={20} className="mr-2" />
                  )}
                  Continue with Existing
                </button>
                <button
                  onClick={handleUpdate}
                  className="flex-1 inline-flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  <RefreshCw size={20} className="mr-2" />
                  Update Credentials
                </button>
              </div>
            </>
          ) : (
            /* Update Form */
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Instructions */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start">
                  <AlertCircle className="text-yellow-600 mr-3 mt-0.5" size={20} />
                  <div className="text-sm text-yellow-800">
                    <p className="font-medium mb-2">How to get WriterZen credentials:</p>
                    <ol className="list-decimal list-inside space-y-1 text-xs">
                      <li>Login to WriterZen in your browser</li>
                      <li>Open Developer Tools (F12)</li>
                      <li>Go to Network tab and refresh the page</li>
                      <li>Find any request to app.writerzen.net</li>
                      <li>Copy the entire Cookie header value</li>
                      <li>Copy the X-XSRF-TOKEN header value</li>
                    </ol>
                  </div>
                </div>
              </div>

              {/* Cookie Field */}
              <div>
                <label htmlFor="cookie" className="block text-sm font-medium text-gray-700 mb-2">
                  Cookie Header
                </label>
                <div className="relative">
                  <textarea
                    id="cookie"
                    name="cookie"
                    required
                    value={formData.cookie}
                    onChange={handleChange}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-xs"
                    placeholder="Paste the entire Cookie header value here..."
                    style={{ fontFamily: "monospace" }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCookie(!showCookie)}
                    className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
                  >
                    {showCookie ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Should start with something like: "laravel_session=...; XSRF-TOKEN=..."
                </p>
              </div>

              {/* X-XSRF-TOKEN Field */}
              <div>
                <label htmlFor="xsrfToken" className="block text-sm font-medium text-gray-700 mb-2">
                  X-XSRF-TOKEN Header
                </label>
                <div className="relative">
                  <input
                    id="xsrfToken"
                    name="xsrfToken"
                    type={showToken ? "text" : "password"}
                    required
                    value={formData.xsrfToken}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-xs"
                    placeholder="Paste the X-XSRF-TOKEN header value here..."
                    style={{ fontFamily: "monospace" }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowToken(!showToken)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showToken ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">Usually a long encoded string without quotes</p>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                {existingData && (
                  <button
                    type="button"
                    onClick={() => setShowUpdateForm(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    Back
                  </button>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !formData.cookie.trim() || !formData.xsrfToken.trim()}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={16} className="mr-2" />
                      Save & Login
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

export default WriterZenCredentialsModal
