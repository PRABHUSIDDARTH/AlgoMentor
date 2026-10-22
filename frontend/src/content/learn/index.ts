import { CN } from './cn'
import { DBMS } from './dbms'
import { OOP } from './oop'
import { OS } from './os'
import type { Lesson, Track, TrackId } from './types'

export type { Lesson, QuizQuestion, Track, TrackId } from './types'

export const TRACKS: Track[] = [OOP, CN, DBMS, OS]

export const TRACK_BY_ID = new Map<TrackId, Track>(TRACKS.map((t) => [t.id, t]))

/** Every module by id, with its track and position. */
export const MODULES = new Map<string, { track: Track; lesson: Lesson; index: number }>(
  TRACKS.flatMap((track) => track.modules.map((lesson, index) => [lesson.id, { track, lesson, index }] as const)),
)
