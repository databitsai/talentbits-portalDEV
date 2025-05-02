import { MatPaginatorIntl } from "@angular/material/paginator";


export function CustomPaginator() {
    const customPaginatorIntl = new MatPaginatorIntl();

    customPaginatorIntl.itemsPerPageLabel = 'Custom_Label:';
    customPaginatorIntl.itemsPerPageLabel = "ítems por página";
    customPaginatorIntl.nextPageLabel = "Siguiente";
    customPaginatorIntl.previousPageLabel = "Anterior";
    customPaginatorIntl.getRangeLabel = (page: number, pageSize: number, length: number) => {
        if (length === 0 || pageSize === 0) {
            return `0 à ${length}`;
        }
        length = Math.max(length, 0);
        const startIndex = page * pageSize;
        // If the start index exceeds the list length, do not try and fix the end index to the end.
        const endIndex = startIndex < length ? Math.min(startIndex + pageSize, length) : startIndex + pageSize;
        return `${startIndex + 1} - ${endIndex} de ${length}`;
    };

    return customPaginatorIntl;
}