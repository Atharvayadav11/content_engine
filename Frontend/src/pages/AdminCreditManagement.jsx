"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import { 
  Search, 
  Users, 
  CreditCard, 
  Plus, 
  Minus, 
  Settings, 
  ArrowLeft,
  AlertTriangle,
  CheckCircle,
  X
} from "lucide-react"
import LoadingSpinner from "../components/LoadingSpinner"

const AdminCreditManagement = () => {
  const navigate = useNavigate()
  const [users, setUsers] = useState([])
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [showCreditModal, setShowCreditModal] = useState(false)
  const [creditForm, setCreditForm] = useState({
    credits: 0,
    action: 'add',
    reason: ''
  })
  const [updating, setUpdating] = useState(false)
  const [pagination, setPagination] = useState({})

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async (page = 1) => {
    setLoading(true)
    try {
      const token = localStorage.getItem("adminToken")
      if (!token) {
        navigate("/admin/login")
        return
      }

      const response = await axios.get(`${import.meta.env.VITE_API_URL}/admin/users?page=${page}&limit=20`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (response.data.success) {
        setUsers(response.data.users)
        setPagination(response.data.pagination)
      }
    } catch (error) {
      console.error("Failed to fetch users:", error)
      if (error.response?.status === 401) {
        navigate("/admin/login")
      }
    } finally {
      setLoading(false)
    }
  }

  const searchUsers = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      return
    }

    setLoading(true)
    try {
      const token = localStorage.getItem("adminToken")
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/admin/users/search?email=${encodeURIComponent(searchQuery)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )

      if (response.data.success) {
        setSearchResults(response.data.users)
      }
    } catch (error) {
      console.error("Search failed:", error)
    } finally {
      setLoading(false)
    }
  }

  const openCreditModal = (user) => {
    setSelectedUser(user)
    setCreditForm({
      credits: 0,
      action: 'add',
      reason: ''
    })
    setShowCreditModal(true)
  }

  const closeCreditModal = () => {
    setShowCreditModal(false)
    setSelectedUser(null)
    setCreditForm({ credits: 0, action: 'add', reason: '' })
  }

  const updateCredits = async () => {
    if (!selectedUser || creditForm.credits < 0) {
      alert("Please enter a valid credit amount")
      return
    }

    if (!creditForm.reason.trim()) {
      alert("Please provide a reason for the credit change")
      return
    }

    const confirmMessage = `Are you sure you want to ${creditForm.action} ${creditForm.credits} credits ${creditForm.action === 'set' ? 'to' : creditForm.action === 'add' ? 'to' : 'from'} ${selectedUser.email}?\n\nReason: ${creditForm.reason}`
    
    if (!window.confirm(confirmMessage)) {
      return
    }

    setUpdating(true)
    try {
      const token = localStorage.getItem("adminToken")
      const response = await axios.put(
        `${import.meta.env.VITE_API_URL}/admin/users/${selectedUser._id}/credits`,
        creditForm,
        { headers: { Authorization: `Bearer ${token}` } }
      )

      if (response.data.success) {
        alert(`Credits updated successfully for ${selectedUser.email}`)
        closeCreditModal()
        fetchUsers() // Refresh the user list
        setSearchResults([]) // Clear search results
      }
    } catch (error) {
      console.error("Failed to update credits:", error)
      alert(error.response?.data?.message || "Failed to update credits")
    } finally {
      setUpdating(false)
    }
  }

  const displayUsers = searchQuery.trim() ? searchResults : users

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => navigate("/admin/dashboard")}
                className="inline-flex items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors mr-4"
              >
                <ArrowLeft size={20} className="mr-2" />
                Back to Dashboard
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Credit Management</h1>
                <p className="text-gray-600 mt-1">Search and manage user credits</p>
              </div>
            </div>
            <div className="flex items-center text-sm text-gray-500">
              <Users size={16} className="mr-2" />
              Total Users: {pagination.totalUsers || users.length}
            </div>
          </div>
        </div>

        {/* Search Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search users by email..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && searchUsers()}
                />
              </div>
            </div>
            <button
              onClick={searchUsers}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Search size={16} className="mr-2" />
              )}
              Search
            </button>
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery("")
                  setSearchResults([])
                }}
                className="inline-flex items-center px-3 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              {searchQuery.trim() ? `Search Results (${searchResults.length})` : 'All Users'}
            </h2>
          </div>

          {loading && !displayUsers.length ? (
            <div className="p-8">
              <LoadingSpinner />
            </div>
          ) : displayUsers.length === 0 ? (
            <div className="p-8 text-center">
              <Users size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchQuery.trim() ? 'No users found' : 'No users yet'}
              </h3>
              <p className="text-gray-600">
                {searchQuery.trim() 
                  ? 'Try adjusting your search query' 
                  : 'Users will appear here when they sign up'
                }
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Credits
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Used
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Joined
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {displayUsers.map((user) => (
                    <tr key={user._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{user.username}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.credits > 0 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          <CreditCard size={12} className="mr-1" />
                          {user.credits}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.totalCreditsUsed || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => openCreditModal(user)}
                          className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors text-sm"
                        >
                          <Settings size={14} className="mr-1" />
                          Manage Credits
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {!searchQuery.trim() && pagination.totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing page {pagination.currentPage} of {pagination.totalPages}
            </div>
            <div className="flex space-x-2">
              {pagination.hasPrevPage && (
                <button
                  onClick={() => fetchUsers(pagination.currentPage - 1)}
                  className="px-3 py-2 bg-white border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50"
                >
                  Previous
                </button>
              )}
              {pagination.hasNextPage && (
                <button
                  onClick={() => fetchUsers(pagination.currentPage + 1)}
                  className="px-3 py-2 bg-white border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50"
                >
                  Next
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Credit Management Modal */}
      {showCreditModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Manage Credits - {selectedUser.username}
              </h3>
              <p className="text-sm text-gray-500 mt-1">{selectedUser.email}</p>
              <p className="text-sm text-gray-600 mt-1">
                Current Credits: <span className="font-medium">{selectedUser.credits}</span>
              </p>
            </div>

            <div className="px-6 py-4 space-y-4">
              {/* Action Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Action
                </label>
                <select
                  value={creditForm.action}
                  onChange={(e) => setCreditForm(prev => ({ ...prev, action: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="add">Add Credits</option>
                  <option value="subtract">Subtract Credits</option>
                  <option value="set">Set Credits</option>
                </select>
              </div>

              {/* Credits Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {creditForm.action === 'set' ? 'New Credit Amount' : 'Credits to ' + creditForm.action}
                </label>
                <input
                  type="number"
                  min="0"
                  value={creditForm.credits}
                  onChange={(e) => setCreditForm(prev => ({ ...prev, credits: parseInt(e.target.value) || 0 }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter amount"
                />
              </div>

              {/* Reason */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={creditForm.reason}
                  onChange={(e) => setCreditForm(prev => ({ ...prev, reason: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows="3"
                  placeholder="Reason for credit change (required)"
                />
              </div>

              {/* Preview */}
              {creditForm.credits > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                  <div className="flex items-center">
                    <AlertTriangle size={16} className="text-blue-600 mr-2" />
                    <span className="text-sm text-blue-800">
                      {creditForm.action === 'set' 
                        ? `Will set credits to ${creditForm.credits}`
                        : creditForm.action === 'add'
                        ? `Will add ${creditForm.credits} credits (Total: ${selectedUser.credits + creditForm.credits})`
                        : `Will subtract ${creditForm.credits} credits (Total: ${Math.max(0, selectedUser.credits - creditForm.credits)})`
                      }
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex space-x-3">
              <button
                onClick={closeCreditModal}
                disabled={updating}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={updateCredits}
                disabled={updating || !creditForm.reason.trim() || creditForm.credits < 0}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {updating ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Updating...
                  </div>
                ) : (
                  `${creditForm.action.charAt(0).toUpperCase() + creditForm.action.slice(1)} Credits`
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminCreditManagement
