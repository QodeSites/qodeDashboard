import React from "react";
import { Table, Container, Alert, Card } from "react-bootstrap";

// Define months arrays at the top level
const monthsShort = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

const monthsFull = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

function MonthlyPLTable({ portfolios }) {
  // Early return if no data
  if (!portfolios || portfolios.length === 0) {
    return (
      <Container>
        <Alert variant="warning" className="text-center">
          No data available
        </Alert>
      </Container>
    );
  }

  // Helper function to determine cell styling
  const getCellStyle = (value) => {
    const numValue = parseFloat(value);
    if (numValue > 4) return "table-success fw-semibold";
    if (numValue < -4) return "table-danger fw-semibold";
    return "";
  };

  // Helper function to format cell value
  const formatCellValue = (value) => {
    const numValue = parseFloat(value);
    return isNaN(numValue) ? "0.0%" : `${numValue.toFixed(1)}%`;
  };

  // Render individual cell with appropriate styling
  const renderCell = (value) => {
    return (
      <td className={`text-center ${getCellStyle(value)}`}>
        {formatCellValue(value)}
      </td>
    );
  };

  return (
    <Container>
      <Card className="shadow-sm mb-4">
        <Card.Header className="bg-light">
          <h5 className="mb-0">Monthly PnL Table (%)</h5>
        </Card.Header>
        
        {portfolios.map((portfolio, index) => (
          <Card.Body key={index} className="p-3">
            <Card.Title className="text-center mb-3">
              {portfolio.portfolio_name || `Portfolio ${index + 1}`}
            </Card.Title>
            
            <div className="table-responsive">
              <Table bordered hover className="mb-0">
                <thead className="table-light">
                  <tr>
                    <th className="text-center">Year</th>
                    {monthsShort.map((month) => (
                      <th key={month} className="text-center">
                        {month}
                      </th>
                    ))}
                    <th className="text-center">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {portfolio?.result?.monthly_pl_table?.map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      <td className="table-light text-center fw-semibold">
                        {row.Year}
                      </td>
                      {monthsFull.map((month) => renderCell(row[month]))}
                      {renderCell(row.Total)}
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
            
            {index < portfolios.length - 1 && <hr className="my-4" />}
          </Card.Body>
        ))}
      </Card>
    </Container>
  );
}

export default MonthlyPLTable;