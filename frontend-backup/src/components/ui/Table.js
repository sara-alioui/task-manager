import React from 'react';

const Table = ({ columns, data, onRowClick }) => {
  return (
    <table className="custom-table">
      <thead>
        <tr>
          {columns.map((col, index) => (
            <th key={index}>{col.header}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row, rowIndex) => (
          <tr 
            key={rowIndex} 
            onClick={() => onRowClick && onRowClick(row)}
            className={onRowClick ? 'clickable-row' : ''}
          >
            {columns.map((col, colIndex) => (
              <td key={colIndex}>
                {col.render ? col.render(row) : row[col.field]}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default Table;