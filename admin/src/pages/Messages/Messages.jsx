import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import {
  FiMail,
  FiSend,
  FiInbox,
  FiRefreshCw,
  FiCornerDownRight
} from 'react-icons/fi';

const Messages = ({ url, adminToken }) => {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [draftReplies, setDraftReplies] = useState({});
  const [submittingReplies, setSubmittingReplies] = useState({});
  const [activeFilter, setActiveFilter] = useState('All'); // 'All' | 'Pending' | 'Replied'

  const fetchMessages = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`${url}/api/contact/list`, {
        headers: { token: adminToken },
      });

      if (!response.data?.success) {
        toast.error(response.data?.message || 'Failed to load messages');
        return;
      }

      setMessages(response.data?.data || []);
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to load messages');
    } finally {
      setIsLoading(false);
    }
  }, [adminToken, url]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const handleRefresh = async () => {
    await fetchMessages();
    toast.success('Messages refreshed');
  };

  const formatDate = (value) => {
    if (!value) return '';
    return new Date(value).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleSendReply = async (messageId) => {
    const replyText = (draftReplies[messageId] || '').trim();
    if (!replyText) {
      toast.warning('Please type a reply first.');
      return;
    }

    try {
      setSubmittingReplies((prev) => ({ ...prev, [messageId]: true }));
      const response = await axios.post(
        `${url}/api/contact/reply`,
        { messageId, reply: replyText },
        { headers: { token: adminToken } }
      );

      if (response.data?.success) {
        toast.success('Reply sent successfully');
        setDraftReplies((prev) => ({ ...prev, [messageId]: '' }));
        await fetchMessages();
      } else {
        toast.error(response.data?.message || 'Failed to send reply');
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to send reply');
    } finally {
      setSubmittingReplies((prev) => ({ ...prev, [messageId]: false }));
    }
  };

  // Compute counts
  const totalCount = messages.length;
  const pendingCount = messages.filter(m => !m.reply || m.reply.trim() === '').length;
  const repliedCount = messages.filter(m => m.reply && m.reply.trim() !== '').length;

  // Filter messages
  const filteredMessages = messages.filter((item) => {
    const isReplied = item.reply && item.reply.trim() !== '';
    if (activeFilter === 'Pending') return !isReplied;
    if (activeFilter === 'Replied') return isReplied;
    return true; // 'All'
  }).sort((a, b) => {
    const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
    const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
    return dateB - dateA;
  });

  return (
    <section className='min-h-[calc(100vh-4rem)] bg-[#fffbf6] px-6 py-6 dark:bg-zinc-900 font-sans transition-colors duration-200'>
      <div className='mx-auto max-w-5xl space-y-6'>
        
        {/* Title Header */}
        <div className='flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-5'>
          <div>
            <h2 className='text-4xl font-black text-zinc-900 dark:text-white tracking-tight'>
              Customer Messages!
            </h2>
            <p className='text-s  text-zinc-500 dark:text-zinc-400 mt-1'>
              Quickly view and respond to customer questions.
            </p>
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            className="flex items-center gap-1.5 rounded-lg border border-orange-200 bg-orange-50 px-3.5 py-2 text-xs font-bold text-orange-700 shadow-xs hover:bg-orange-100 cursor-pointer dark:border-orange-850 dark:bg-orange-950/20 dark:text-orange-450 dark:hover:bg-orange-900/30 transition active:scale-95"
          >
            <FiRefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Filters and Tabs */}
        <div className='flex items-center gap-2 flex-wrap'>
          {[
            { id: 'All', label: 'All Messages', count: totalCount },
            { id: 'Pending', label: 'Pending Reply', count: pendingCount },
            { id: 'Replied', label: 'Replied', count: repliedCount }
          ].map((tab) => {
            const isActive = activeFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveFilter(tab.id)}
                className={`px-3.5 py-1.5 rounded-lg text-s font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
                  isActive
                    ? 'border-orange-200 bg-orange-50/80 text-orange-900 dark:border-orange-500/20 dark:bg-orange-500/10 dark:text-orange-300 shadow-sm'
                    : 'bg-white hover:bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                  isActive 
                    ? 'bg-orange-200/50 text-orange-950 dark:bg-orange-500/25 dark:text-orange-200' 
                    : 'bg-zinc-100 text-zinc-650 dark:bg-zinc-800 dark:text-zinc-400'
                }`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Messages List */}
        {isLoading && messages.length === 0 ? (
          <div className='py-20 text-center'>
            <FiRefreshCw className='h-6 w-6 animate-spin mx-auto text-zinc-400 mb-2' />
            <p className='text-xs text-zinc-500 dark:text-zinc-400 font-semibold'>Loading...</p>
          </div>
        ) : filteredMessages.length === 0 ? (
          <div className='rounded-2xl border border-zinc-200 bg-white py-16 text-center dark:border-zinc-800 dark:bg-zinc-900 shadow-xs'>
            <FiInbox className='h-12 w-12 text-zinc-300 dark:text-zinc-700 mx-auto mb-3' />
            <h4 className='text-sm font-bold text-zinc-800 dark:text-zinc-200'>
              No customer messages yet
            </h4>
            <p className='text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-xs mx-auto'>
              All customer inquiries will appear here.
            </p>
          </div>
        ) : (
          <div className='space-y-4'>
            {filteredMessages.map((item) => {
              const isReplied = item.reply && item.reply.trim() !== '';

              return (
                <article
                  key={item._id}
                  className='rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900 space-y-4'
                >
                  {/* Card Header (natural information flow) */}
                  <div className='flex flex-wrap items-start justify-between gap-3 border-b border-zinc-100 dark:border-zinc-800/60 pb-3'>
                    <div className='space-y-0.5'>
                      <h3 className='text-base font-extrabold text-zinc-900 dark:text-white'>
                        {item.name}
                      </h3>
                      <div className='flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs font-semibold text-zinc-500 dark:text-zinc-400'>
                        <a href={`mailto:${item.email}`} className='hover:underline text-zinc-650 dark:text-zinc-350'>
                          {item.email}
                        </a>
                        {item.phone && (
                          <>
                            <span className='text-zinc-300 dark:text-zinc-700'>•</span>
                            <span>{item.phone}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className='flex items-center gap-2'>
                      <span className='text-[11px] font-semibold text-zinc-400 dark:text-zinc-500'>
                        {formatDate(item.createdAt)}
                      </span>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                        isReplied 
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400' 
                          : 'bg-orange-50 text-orange-700 dark:bg-orange-950/20 dark:text-orange-400'
                      }`}>
                        {isReplied ? 'Replied' : 'Pending'}
                      </span>
                    </div>
                  </div>

                  {/* Customer Message content */}
                  <div className='text-sm text-zinc-800 dark:text-zinc-200 font-medium leading-relaxed bg-zinc-50 dark:bg-zinc-950/50 p-4 rounded-xl border border-zinc-100 dark:border-zinc-850'>
                    {item.message}
                  </div>

                  {/* Response display or inline reply editor */}
                  {isReplied ? (
                    <div className='flex items-start gap-2.5 bg-zinc-50/55 dark:bg-zinc-850/30 border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl'>
                      <FiCornerDownRight className='w-4 h-4 text-zinc-400 mt-0.5 flex-shrink-0' />
                      <div className='space-y-1'>
                        <span className='text-[9px] font-black uppercase tracking-wider text-zinc-400 dark:text-zinc-500 block'>
                          Admin Response
                        </span>
                        <p className='text-sm text-zinc-800 dark:text-zinc-200 font-semibold leading-relaxed'>
                          {item.reply}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className='space-y-3 pt-1'>
                      <div className='relative'>
                        <textarea
                          rows={2}
                          placeholder='Type your reply message...'
                          value={draftReplies[item._id] || ''}
                          onChange={(e) => setDraftReplies((prev) => ({ ...prev, [item._id]: e.target.value }))}
                          className='w-full text-sm font-semibold bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl pl-4 pr-12 py-3 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-600 text-zinc-850 dark:text-zinc-150 placeholder-zinc-400 transition shadow-xs leading-relaxed focus:bg-white dark:focus:bg-zinc-900'
                        />
                        <button
                          type='button'
                          disabled={submittingReplies[item._id]}
                          onClick={() => handleSendReply(item._id)}
                          className='absolute right-2 bottom-2 p-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg active:scale-95 transition disabled:opacity-50 cursor-pointer dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 shadow-xs'
                          title='Send reply'
                        >
                          {submittingReplies[item._id] ? (
                            <span className='h-4 w-4 border-2 border-white dark:border-zinc-900 border-t-transparent rounded-full animate-spin block' />
                          ) : (
                            <FiSend className='w-4 h-4' />
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};

export default Messages;