import { useState, useMemo, useCallback, useEffect } from 'react';
import { TableRow, FilterState, TableState } from '../types';
import { useDebounce } from './useDebounce';
import { useLocation, useNavigate } from 'react-router-dom';

const deserializeFilters = (queryString: string): FilterState => {
    const params = new URLSearchParams(queryString);
    return {
        textFilter: params.get('textFilter') || '',
        roleFilter: params.get('roleFilter') || '',
        statusFilter: params.get('statusFilter') || '',
        scoreMin: params.has('scoreMin')
            ? parseInt(params.get('scoreMin')!)
            : null,
        scoreMax: params.has('scoreMax')
            ? parseInt(params.get('scoreMax')!)
            : null,
    };
};

const serializeFilters = (filters: FilterState): string => {
    const params = new URLSearchParams();
    if (filters.textFilter) params.set('textFilter', filters.textFilter);
    if (filters.roleFilter) params.set('roleFilter', filters.roleFilter);
    if (filters.statusFilter) params.set('statusFilter', filters.statusFilter);
    if (filters.scoreMin !== null)
        params.set('scoreMin', filters.scoreMin.toString());
    if (filters.scoreMax !== null)
        params.set('scoreMax', filters.scoreMax.toString());
    return params.toString();
};

export function useTableData(initialData: TableRow[]) {
    const location = useLocation();
    const navigate = useNavigate();

    const initialFilterState = useMemo(
        () => deserializeFilters(location.search),
        [location.search]
    );

    const [state, setState] = useState<TableState>({
        data: initialData,
        filteredData: initialData,
        selectedRows: new Set(),
        filters: initialFilterState,
        sortColumn: null,
        sortDirection: 'asc',
    });

    const debouncedTextFilter = useDebounce(state.filters.textFilter, 300);

    useEffect(() => {
        const queryString = serializeFilters(state.filters);
        if (queryString !== location.search.substring(1)) {
            navigate({ search: queryString }, { replace: true });
        }
    }, [state.filters, location.search, navigate]);

    useEffect(() => {
        setState((prev) => ({
            ...prev,
            data: initialData,
        }));
    }, [initialData]);

    const filteredData = useMemo(() => {
        let filtered = state.data;

        if (
            debouncedTextFilter ||
            state.filters.roleFilter ||
            state.filters.statusFilter ||
            state.filters.scoreMin !== null ||
            state.filters.scoreMax !== null
        ) {
            const searchTerm = debouncedTextFilter?.toLowerCase();

            filtered = filtered.filter((row) => {
                if (
                    searchTerm &&
                    !row.name.toLowerCase().includes(searchTerm) &&
                    !row.email.toLowerCase().includes(searchTerm)
                ) {
                    return false;
                }

                if (
                    state.filters.roleFilter &&
                    row.role !== state.filters.roleFilter
                ) {
                    return false;
                }

                if (
                    state.filters.statusFilter &&
                    row.status !== state.filters.statusFilter
                ) {
                    return false;
                }

                if (
                    state.filters.scoreMin !== null &&
                    row.score < state.filters.scoreMin!
                ) {
                    return false;
                }
                if (
                    state.filters.scoreMax !== null &&
                    row.score > state.filters.scoreMax!
                ) {
                    return false;
                }

                return true;
            });
        }

        if (state.sortColumn) {
            filtered.sort((a, b) => {
                const aVal = a[state.sortColumn!];
                const bVal = b[state.sortColumn!];

                let comparison = 0;
                if (aVal < bVal) comparison = -1;
                else if (aVal > bVal) comparison = 1;

                return state.sortDirection === 'asc' ? comparison : -comparison;
            });
        }

        return filtered;
    }, [
        state.data,
        debouncedTextFilter,
        state.filters.roleFilter,
        state.filters.statusFilter,
        state.filters.scoreMin,
        state.filters.scoreMax,
        state.sortColumn,
        state.sortDirection,
    ]);

    const updateFilters = useCallback((newFilters: Partial<FilterState>) => {
        setState((prev) => {
            const updatedFilters = { ...prev.filters, ...newFilters };
            return {
                ...prev,
                filters: updatedFilters,
                selectedRows: new Set(),
            };
        });
    }, []);

    const clearAllFilters = useCallback(() => {
        setState((prev) => ({
            ...prev,
            filters: deserializeFilters(''),
            selectedRows: new Set(),
        }));
    }, []);

    const setSorting = useCallback((column: keyof TableRow) => {
        setState((prev) => ({
            ...prev,
            sortColumn: column,
            sortDirection:
                prev.sortColumn === column && prev.sortDirection === 'asc'
                    ? 'desc'
                    : 'asc',
        }));
    }, []);

    const toggleRowSelection = useCallback((id: string, selected: boolean) => {
        setState((prev) => {
            const newSelected = new Set(prev.selectedRows);
            if (selected) {
                newSelected.add(id);
            } else {
                newSelected.delete(id);
            }
            return { ...prev, selectedRows: newSelected };
        });
    }, []);

    const selectAllRows = useCallback(
        (selected: boolean) => {
            setState((prev) => ({
                ...prev,
                selectedRows: selected
                    ? new Set(filteredData.map((row) => row.id))
                    : new Set(),
            }));
        },
        [filteredData]
    );

    const getActiveFilters = useCallback(() => {
        const active = [];
        if (state.filters.textFilter) {
            active.push({
                key: 'textFilter',
                label: `Text: "${state.filters.textFilter}"`,
                value: state.filters.textFilter,
            });
        }
        if (state.filters.roleFilter) {
            active.push({
                key: 'roleFilter',
                label: `Role: ${state.filters.roleFilter}`,
                value: state.filters.roleFilter,
            });
        }
        if (state.filters.statusFilter) {
            active.push({
                key: 'statusFilter',
                label: `Status: ${state.filters.statusFilter}`,
                value: state.filters.statusFilter,
            });
        }
        if (state.filters.scoreMin !== null) {
            active.push({
                key: 'scoreMin',
                label: `Score ≥ ${state.filters.scoreMin}`,
                value: state.filters.scoreMin,
            });
        }
        if (state.filters.scoreMax !== null) {
            active.push({
                key: 'scoreMax',
                label: `Score ≤ ${state.filters.scoreMax}`,
                value: state.filters.scoreMax,
            });
        }
        return active;
    }, [state.filters]);

    const removeFilter = useCallback((key: keyof FilterState) => {
        setState((prev) => ({
            ...prev,
            filters: {
                ...prev.filters,
                [key]:
                    key === 'textFilter' ||
                    key === 'roleFilter' ||
                    key === 'statusFilter'
                        ? ''
                        : null,
            },
            selectedRows: new Set(),
        }));
    }, []);

    return {
        ...state,
        filteredData,
        updateFilters,
        clearAllFilters,
        setSorting,
        toggleRowSelection,
        selectAllRows,
        getActiveFilters,
        removeFilter,
    };
}
