export class LinkedListNode<T> {
  value: T
  next: LinkedListNode<T> | null = null
  prev: LinkedListNode<T> | null = null

  constructor(value: T) {
    this.value = value
  }
}

export class CircularLinkedList<T> {
  head: LinkedListNode<T> | null = null
  #length = 0

  get length(): number {
    return this.#length
  }

  insert(value: T): LinkedListNode<T> {
    const node = new LinkedListNode(value)

    if (!this.head) {
      this.head = node
      node.next = node
      node.prev = node
    } else {
      const tail = this.head.prev!
      tail.next = node
      node.prev = tail
      node.next = this.head
      this.head.prev = node
    }

    this.#length++
    return node
  }

  find(predicate: (value: T) => boolean): LinkedListNode<T> | null {
    if (!this.head) return null

    let current = this.head
    do {
      if (predicate(current.value)) return current
      current = current.next!
    } while (current !== this.head)

    return null
  }

  findCurrent(nowMinutes: number, accessor: (value: T) => number): LinkedListNode<T> | null {
    if (!this.head) return null

    let candidate: LinkedListNode<T> | null = null
    let current = this.head

    do {
      if (accessor(current.value) <= nowMinutes) {
        candidate = current
      }
      current = current.next!
    } while (current !== this.head)

    return candidate
  }

  toArray(): T[] {
    if (!this.head) return []

    const result: T[] = []
    let current = this.head
    do {
      result.push(current.value)
      current = current.next!
    } while (current !== this.head)

    return result
  }

  *[Symbol.iterator](): Iterator<T> {
    if (!this.head) return

    let current = this.head
    do {
      yield current.value
      current = current.next!
    } while (current !== this.head)
  }
}
