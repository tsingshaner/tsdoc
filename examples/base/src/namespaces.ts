export namespace Entity {
  interface IEntity {
    id: number
  }

  export interface User extends IEntity {
    age: number
    name: string
  }

  export interface Post extends IEntity {
    content: string
    title: string
  }

  export const getUser = (id: number): User => {
    return {
      age: 18,
      id,
      name: 'Alice'
    }
  }
}
