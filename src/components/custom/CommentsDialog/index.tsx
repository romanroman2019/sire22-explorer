import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { useAuth } from '@/hooks/useAuth'
import { useComments } from '@/hooks/useComments'
import type { Comment, LinkItem } from '@/lib/repositories/commentRepository'

function formatTimestamp(
  ts: { seconds: number; nanoseconds: number } | null
): string {
  if (!ts) return 'Just now'
  const date = new Date(ts.seconds * 1000)
  return date.toLocaleString()
}

function getUserDisplayName(user: {
  displayName: string | null
  email: string | null
  uid: string
}): string {
  return user.displayName || user.email || 'Anonymous'
}

interface LinkFormProps {
  links: LinkItem[]
  onChange: (links: LinkItem[]) => void
}

function LinkForm({ links, onChange }: LinkFormProps) {
  function addLink() {
    onChange([...links, { description: '', link: '' }])
  }

  function removeLink(index: number) {
    onChange(links.filter((_, i) => i !== index))
  }

  function updateLink(index: number, field: keyof LinkItem, value: string) {
    const updated = links.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    )
    onChange(updated)
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium">Links</label>
      {links.map((item, index) => (
        <div key={index} className="flex items-start gap-2">
          <div className="flex-1 space-y-1">
            <Input
              placeholder="Description"
              value={item.description}
              onChange={(e) => updateLink(index, 'description', e.target.value)}
            />
            <Input
              placeholder="URL"
              value={item.link}
              onChange={(e) => updateLink(index, 'link', e.target.value)}
            />
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-destructive mt-1"
            onClick={() => removeLink(index)}
          >
            ×
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={addLink}>
        + Add Link
      </Button>
    </div>
  )
}

interface LinksDisplayProps {
  links: LinkItem[]
}

function LinksDisplay({ links }: LinksDisplayProps) {
  if (!links || links.length === 0) return null
  return (
    <div>
      <span className="text-xs font-semibold text-muted-foreground">Links:</span>
      <ul className="mt-1 space-y-1">
        {links.map((item, index) => (
          <li key={index}>
            <a
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary underline underline-offset-2 hover:text-primary/80"
            >
              {item.description || item.link}
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}

interface ReplySectionProps {
  replies: Comment['replies']
  commentId: string
  onAddReply: (commentId: string, content: string) => Promise<void>
  isAddingReply: boolean
  isAuthenticated: boolean
}

function ReplySection({
  replies,
  commentId,
  onAddReply,
  isAddingReply,
  isAuthenticated,
}: ReplySectionProps) {
  const [replyContent, setReplyContent] = useState('')
  const [isReplying, setIsReplying] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!replyContent.trim()) return
    await onAddReply(commentId, replyContent.trim())
    setReplyContent('')
    setIsReplying(false)
  }

  return (
    <div className="mt-2 space-y-2">
      <span className="text-xs font-semibold text-muted-foreground">
        Replies ({replies.length}):
      </span>
      {replies.length === 0 && (
        <p className="text-xs text-muted-foreground">No replies yet.</p>
      )}
      {replies.map((reply, index) => (
        <div key={index} className="rounded-md bg-muted/50 p-2">
          <p className="whitespace-pre-wrap text-sm">{reply.content}</p>
          <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
            <span>{getUserDisplayName(reply.createdBy)}</span>
            <span>·</span>
            <span>{formatTimestamp(reply.createdAt)}</span>
            {reply.modifiedAt &&
              reply.modifiedAt.seconds !== reply.createdAt?.seconds && (
                <>
                  <span>·</span>
                  <span>Edited {formatTimestamp(reply.modifiedAt)}</span>
                </>
              )}
          </div>
        </div>
      ))}
      {isAuthenticated && (
        <div>
          {isReplying ? (
            <form onSubmit={handleSubmit} className="flex gap-2">
              <Input
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Write a reply..."
              />
              <Button
                type="submit"
                size="sm"
                disabled={isAddingReply || !replyContent.trim()}
              >
                {isAddingReply ? 'Sending...' : 'Reply'}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsReplying(false)
                  setReplyContent('')
                }}
              >
                Cancel
              </Button>
            </form>
          ) : (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsReplying(true)}
            >
              Reply
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

interface CommentCardProps {
  comment: Comment
  isOwner: boolean
  onEdit: (comment: Comment) => void
  onDelete: (commentId: string) => void
  onAddReply: (commentId: string, content: string) => Promise<void>
  isAddingReply: boolean
  isAuthenticated: boolean
}

function CommentCard({
  comment,
  isOwner,
  onEdit,
  onDelete,
  onAddReply,
  isAddingReply,
  isAuthenticated,
}: CommentCardProps) {
  return (
    <Card size="sm">
      <CardHeader className="border-b bg-muted/70 py-3">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <CardTitle className="text-sm font-medium">
              {getUserDisplayName(comment.createdBy)}
            </CardTitle>
            <CardDescription className="text-xs">
              Created: {formatTimestamp(comment.createdAt)}
              {comment.modifiedAt &&
                comment.modifiedAt.seconds !== comment.createdAt?.seconds && (
                  <span> · Modified: {formatTimestamp(comment.modifiedAt)}</span>
                )}
            </CardDescription>
          </div>
          {isOwner && (
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(comment)}
              >
                Edit
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={() => onDelete(comment.id)}
              >
                Delete
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-2 pt-3">
        <div>
          <span className="text-xs font-semibold text-muted-foreground">
            Problem:
          </span>
          <p className="whitespace-pre-wrap text-sm">{comment.problem || '—'}</p>
        </div>
        <div>
          <span className="text-xs font-semibold text-muted-foreground">
            Solution:
          </span>
          <p className="whitespace-pre-wrap text-sm">{comment.solution || '—'}</p>
        </div>
        <LinksDisplay links={comment.links} />
        <Separator />
        <ReplySection
          replies={comment.replies}
          commentId={comment.id}
          onAddReply={onAddReply}
          isAddingReply={isAddingReply}
          isAuthenticated={isAuthenticated}
        />
      </CardContent>
    </Card>
  )
}

interface CommentFormProps {
  initialValues?: { problem: string; solution: string; links: LinkItem[] }
  onSubmit: (values: {
    problem: string
    solution: string
    links: LinkItem[]
  }) => void
  onCancel: () => void
  isSubmitting: boolean
  submitLabel: string
}

function CommentForm({
  initialValues,
  onSubmit,
  onCancel,
  isSubmitting,
  submitLabel,
}: CommentFormProps) {
  const [problem, setProblem] = useState(initialValues?.problem ?? '')
  const [solution, setSolution] = useState(initialValues?.solution ?? '')
  const [links, setLinks] = useState<LinkItem[]>(initialValues?.links ?? [])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSubmit({ problem, solution, links })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="mb-1 block text-sm font-medium">Problem</label>
        <Textarea
          value={problem}
          onChange={(e) => setProblem(e.target.value)}
          placeholder="Describe the problem..."
          rows={2}
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Solution</label>
        <Textarea
          value={solution}
          onChange={(e) => setSolution(e.target.value)}
          placeholder="Describe the solution..."
          rows={2}
        />
      </div>
      <LinkForm links={links} onChange={setLinks} />
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" size="sm" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : submitLabel}
        </Button>
      </div>
    </form>
  )
}

interface CommentsDialogProps {
  questionId: string | undefined
  questionTitle?: string
}

export function CommentsDialog({ questionId, questionTitle }: CommentsDialogProps) {
  const { user, isAuthenticated } = useAuth()
  const {
    comments,
    isLoading,
    isError,
    error,
    createComment,
    updateComment,
    deleteComment,
    addReply,
    isCreating,
    isUpdating,
    isAddingReply,
  } = useComments(questionId)

  const [isOpen, setIsOpen] = useState(false)
  const [editingComment, setEditingComment] = useState<Comment | null>(null)
  const [isCreatingMode, setIsCreatingMode] = useState(false)
  const [mutationError, setMutationError] = useState<string | null>(null)

  async function handleCreate(values: {
    problem: string
    solution: string
    links: LinkItem[]
  }) {
    if (!user || !questionId) return
    setMutationError(null)
    try {
      await createComment({
        questionid: questionId,
        ...values,
        user: {
          uid: user.uid,
          displayName: user.displayName,
          email: user.email,
        },
      })
      setIsCreatingMode(false)
    } catch (err) {
      setMutationError(err instanceof Error ? err.message : 'Failed to create comment')
    }
  }

  async function handleUpdate(values: {
    problem: string
    solution: string
    links: LinkItem[]
  }) {
    if (!editingComment || !user) return
    setMutationError(null)
    try {
      await updateComment({
        commentId: editingComment.id,
        input: {
          ...values,
          user: {
            uid: user.uid,
            displayName: user.displayName,
            email: user.email,
          },
        },
      })
      setEditingComment(null)
    } catch (err) {
      setMutationError(err instanceof Error ? err.message : 'Failed to update comment')
    }
  }

  async function handleDelete(commentId: string) {
    if (!window.confirm('Are you sure you want to delete this comment?')) return
    setMutationError(null)
    try {
      await deleteComment(commentId)
    } catch (err) {
      setMutationError(err instanceof Error ? err.message : 'Failed to delete comment')
    }
  }

  async function handleAddReply(commentId: string, content: string) {
    if (!user) return
    setMutationError(null)
    try {
      await addReply({
        commentId,
        input: {
          content,
          user: {
            uid: user.uid,
            displayName: user.displayName,
            email: user.email,
          },
        },
      })
    } catch (err) {
      setMutationError(err instanceof Error ? err.message : 'Failed to add reply')
    }
  }

  function handleOpenChange(open: boolean) {
    setIsOpen(open)
    if (!open) {
      setEditingComment(null)
      setIsCreatingMode(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <div className="flex items-center gap-2">
        <Badge variant="secondary">
          {comments.length} comment{comments.length !== 1 ? 's' : ''}
        </Badge>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            View Comments
          </Button>
        </DialogTrigger>
      </div>
      <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Comments
            {questionTitle && (
              <span className="text-sm font-normal text-muted-foreground">
                — {questionTitle}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {mutationError && (
            <Alert variant="destructive">
              <AlertDescription>{mutationError}</AlertDescription>
            </Alert>
          )}

          {isLoading && <p className="text-sm text-muted-foreground">Loading comments...</p>}

          {isError && (
            <p className="text-sm text-destructive">
              Error loading comments: {error?.message}
            </p>
          )}

          {!isLoading && !isError && comments.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No comments yet. Be the first to add one!
            </p>
          )}

          {!isLoading && !isError && (
            <div className="space-y-3">
              {comments.map((comment) => (
                <CommentCard
                  key={comment.id}
                  comment={comment}
                  isOwner={isAuthenticated && user?.uid === comment.createdBy.uid}
                  onEdit={setEditingComment}
                  onDelete={handleDelete}
                  onAddReply={handleAddReply}
                  isAddingReply={isAddingReply}
                  isAuthenticated={isAuthenticated}
                />
              ))}
            </div>
          )}

          {/* Edit form */}
          {editingComment && (
            <div className="rounded-lg border p-4">
              <h4 className="mb-3 text-sm font-semibold">Edit Comment</h4>
              <CommentForm
                initialValues={{
                  problem: editingComment.problem,
                  solution: editingComment.solution,
                  links: editingComment.links,
                }}
                onSubmit={handleUpdate}
                onCancel={() => setEditingComment(null)}
                isSubmitting={isUpdating}
                submitLabel="Update"
              />
            </div>
          )}

          {/* Create form */}
          {isCreatingMode && (
            <div className="rounded-lg border p-4">
              <h4 className="mb-3 text-sm font-semibold">New Comment</h4>
              <CommentForm
                onSubmit={handleCreate}
                onCancel={() => setIsCreatingMode(false)}
                isSubmitting={isCreating}
                submitLabel="Create"
              />
            </div>
          )}

          {/* Add comment button (only for authenticated users) */}
          {isAuthenticated && !isCreatingMode && !editingComment && (
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => setIsCreatingMode(true)}
            >
              Add Comment
            </Button>
          )}

          {!isAuthenticated && (
            <p className="text-center text-xs text-muted-foreground">
              Sign in to add, edit, or delete comments.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}