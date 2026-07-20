import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'

export interface LinkItem {
  description: string
  link: string
}

export interface ReplyItem {
  content: string
  createdAt: Timestamp | null
  createdBy: {
    uid: string
    displayName: string | null
    email: string | null
  }
  modifiedAt: Timestamp | null
  modifiedBy: {
    uid: string
    displayName: string | null
    email: string | null
  }
}

export interface Comment {
  id: string
  questionid: string
  problem: string
  solution: string
  links: LinkItem[]
  replies: ReplyItem[]
  createdAt: Timestamp | null
  createdBy: {
    uid: string
    displayName: string | null
    email: string | null
  }
  modifiedAt: Timestamp | null
  modifiedBy: {
    uid: string
    displayName: string | null
    email: string | null
  }
}

export interface CreateCommentInput {
  questionid: string
  problem: string
  solution: string
  links: LinkItem[]
  user: {
    uid: string
    displayName: string | null
    email: string | null
  }
}

export interface UpdateCommentInput {
  problem: string
  solution: string
  links: LinkItem[]
  user: {
    uid: string
    displayName: string | null
    email: string | null
  }
}

export interface AddReplyInput {
  content: string
  user: {
    uid: string
    displayName: string | null
    email: string | null
  }
}

function getCommentsCollection() {
  return collection(db, 'comments')
}

export const commentRepository = {
  async getByQuestionId(questionId: string): Promise<Comment[]> {
    const q = query(
      getCommentsCollection(),
      where('questionid', '==', questionId),
      orderBy('createdAt', 'asc')
    )
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Comment[]
  },

  async getById(commentId: string): Promise<Comment | null> {
    const docSnap = await getDoc(doc(db, 'comments', commentId))
    if (!docSnap.exists()) return null
    return { id: docSnap.id, ...docSnap.data() } as Comment
  },

  async create(input: CreateCommentInput): Promise<Comment> {
    const now = serverTimestamp()
    const userData = {
      uid: input.user.uid,
      displayName: input.user.displayName,
      email: input.user.email,
    }
    const docRef = await addDoc(getCommentsCollection(), {
      questionid: input.questionid,
      problem: input.problem,
      solution: input.solution,
      links: input.links,
      replies: [],
      createdAt: now,
      createdBy: userData,
      modifiedAt: now,
      modifiedBy: userData,
    })
    return {
      id: docRef.id,
      questionid: input.questionid,
      problem: input.problem,
      solution: input.solution,
      links: input.links,
      replies: [],
      createdAt: null,
      createdBy: userData,
      modifiedAt: null,
      modifiedBy: userData,
    }
  },

  async update(commentId: string, input: UpdateCommentInput): Promise<void> {
    const now = serverTimestamp()
    const userData = {
      uid: input.user.uid,
      displayName: input.user.displayName,
      email: input.user.email,
    }
    await updateDoc(doc(db, 'comments', commentId), {
      problem: input.problem,
      solution: input.solution,
      links: input.links,
      modifiedAt: now,
      modifiedBy: userData,
    })
  },

  async addReply(commentId: string, input: AddReplyInput): Promise<void> {
    const replyTimestamp = Timestamp.now()
    const serverNow = serverTimestamp()
    const userData = {
      uid: input.user.uid,
      displayName: input.user.displayName,
      email: input.user.email,
    }
    const reply: ReplyItem = {
      content: input.content,
      createdAt: replyTimestamp,
      createdBy: userData,
      modifiedAt: replyTimestamp,
      modifiedBy: userData,
    }
    const commentRef = doc(db, 'comments', commentId)
    const commentSnap = await getDoc(commentRef)
    if (!commentSnap.exists()) {
      throw new Error('Comment not found')
    }
    const existingReplies: ReplyItem[] = commentSnap.data().replies ?? []
    await updateDoc(commentRef, {
      replies: [...existingReplies, reply],
      modifiedAt: serverNow,
      modifiedBy: userData,
    })
  },

  async getAllQuestionIdsWithComments(): Promise<string[]> {
    const q = query(getCommentsCollection())
    const querySnapshot = await getDocs(q)
    const questionIds = new Set<string>()
    querySnapshot.docs.forEach((doc) => {
      const data = doc.data()
      if (data.questionid) {
        questionIds.add(data.questionid)
      }
    })
    return Array.from(questionIds)
  },

  async delete(commentId: string): Promise<void> {
    await deleteDoc(doc(db, 'comments', commentId))
  },
}