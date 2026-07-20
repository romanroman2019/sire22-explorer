import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { commentRepository } from '@/lib/repositories/commentRepository'
import type { CreateCommentInput, UpdateCommentInput, AddReplyInput } from '@/lib/repositories/commentRepository'

export function useComments(questionId: string | undefined) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['comments', questionId],
    queryFn: () => commentRepository.getByQuestionId(questionId!),
    enabled: !!questionId,
    staleTime: 1000 * 60 * 1, // 1 minute
  })

  const createMutation = useMutation({
    mutationFn: (input: CreateCommentInput) =>
      commentRepository.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', questionId] })
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ commentId, input }: { commentId: string; input: UpdateCommentInput }) =>
      commentRepository.update(commentId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', questionId] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (commentId: string) =>
      commentRepository.delete(commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', questionId] })
    },
  })

  const addReplyMutation = useMutation({
    mutationFn: ({ commentId, input }: { commentId: string; input: AddReplyInput }) =>
      commentRepository.addReply(commentId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', questionId] })
    },
  })

  return {
    comments: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    createComment: createMutation.mutateAsync,
    updateComment: updateMutation.mutateAsync,
    deleteComment: deleteMutation.mutateAsync,
    addReply: addReplyMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isAddingReply: addReplyMutation.isPending,
  }
}