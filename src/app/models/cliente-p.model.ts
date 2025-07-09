export interface ClienteP {
    id?: number;
    numId: string;
    nombres: string;
    apellidos: string;
    correo?: string;
    fechaCreacion?: Date;
    fechaModificacion?: Date;
    estado?: boolean;
}
export interface PagedResult<T> {
    items: T[];
    totalCount: number;
    pageNumber: number;
    pageSize: number;
    totalPages: number;
    hasPreviousPage: boolean;
    hasNextPage: boolean;
}

export interface ClientePQueryParams {
    pageNumber?: number;
    pageSize?: number;
    sortField?: string;
    sortDirection?: 'asc' | 'desc';
    nombres?: string;
    numId?: string;
    estado?: boolean;
}