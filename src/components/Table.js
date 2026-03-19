import { useTable } from 'react-table';

// Table component using react-table
function Table({ columns, data }) {
    const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } =
        useTable({ columns, data });

    return (
        <div className="table-wrapper">
            <table {...getTableProps()} className="styled-table">
                <thead>
                    {headerGroups.map((headerGroup, headerGroupIndex) => {
                        const headerGroupProps = headerGroup.getHeaderGroupProps();
                        const headerGroupKey = headerGroupProps.key ?? headerGroup.id ?? `header-group-${headerGroupIndex}`;

                        return (
                            <tr {...headerGroupProps} key={headerGroupKey}>
                                {headerGroup.headers.map((column, columnIndex) => (
                                    <th
                                        {...column.getHeaderProps()}
                                        key={column.id ?? `header-${headerGroupIndex}-${columnIndex}`}
                                    >
                                        {column.render('Header')}
                                    </th>
                                ))}
                            </tr>
                        );
                    })}
                </thead>
                <tbody {...getTableBodyProps()}>
                    {rows.map((row, rowIndex) => {
                        prepareRow(row);
                        const notPlayedYet = row.original.pts === 'Not played yet';
                        const alive = row.original.alive;
                        const rowProps = row.getRowProps();
                        const rowKey = rowProps.key ?? row.id ?? `row-${rowIndex}`;

                        const rowClass = [
                            alive === 'No' ? 'row-eliminated' : '',
                            notPlayedYet ? 'row-not-played' : '',
                        ].filter(Boolean).join(' ');

                        return (
                            <tr
                                {...rowProps}
                                key={rowKey}
                                className={rowClass || undefined}
                            >
                                {row.cells.map((cell, cellIndex) => {
                                    const cellProps = cell.getCellProps();
                                    const cellKey = cellProps.key ?? cell.column.id ?? `cell-${rowKey}-${cellIndex}`;

                                    return (
                                        <td
                                            {...cellProps}
                                            key={cellKey}
                                            data-label={cell.column.Header}
                                        >
                                            {cell.render('Cell')}
                                        </td>
                                    );
                                })}
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}

export default Table;
