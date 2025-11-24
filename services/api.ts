
import { ApiResponse, Transaction, CreateTransactionPayload, UpdateTransactionPayload } from '../types';

const BASE_API_URL = 'https://script.google.com/macros/s/AKfycbwn0HQvpae92CTQau13v_rJ05MGiGjzXmztndndDUajGmBygkPIlNoLPrAlRExBDlIi/exec';

export const fetchTransactions = async (): Promise<Transaction[]> => {
  try {
    const response = await fetch(`${BASE_API_URL}?action=list`);
    if (!response.ok) {
      throw new Error(`Error fetching data: ${response.statusText}`);
    }
    const json: ApiResponse = await response.json();
    if (json.status !== 'ok') {
      throw new Error('API returned invalid status');
    }
    
    // Sort by date descending by default
    return json.data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  } catch (error) {
    console.error("Failed to load transactions", error);
    throw error;
  }
};

export const fetchExchangeRate = async (date: string, fromCurr: string): Promise<number> => {
  if (fromCurr === 'CHF') return 1;

  try {
    // Frankfurter expects YYYY-MM-DD. 
    // Use 'latest' if the date is in the future to avoid errors, though transactions are usually past.
    const today = new Date().toISOString().split('T')[0];
    const queryDate = date > today ? 'latest' : date;
    
    const response = await fetch(`https://api.frankfurter.dev/v1/${queryDate}?base=${fromCurr}&symbols=CHF`);
    if (!response.ok) {
        throw new Error(`Frankfurter API error: ${response.statusText}`);
    }
    const data = await response.json();
    return data.rates.CHF;
  } catch (error) {
    console.error("Failed to fetch exchange rate", error);
    throw error;
  }
};

export const createTransaction = async (payload: CreateTransactionPayload): Promise<void> => {
  try {
    // Google Apps Script Web Apps often require using text/plain content type to avoid CORS preflight OPTIONS requests,
    // which the script might not be configured to handle. The body is still valid JSON string.
    const response = await fetch(`${BASE_API_URL}?action=create`, {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
    });

    if (!response.ok) {
      throw new Error(`Error creating transaction: ${response.statusText}`);
    }

    const json = await response.json();
    if (json.status !== 'ok') {
      throw new Error('API returned invalid status for creation');
    }
  } catch (error) {
    console.error("Failed to create transaction", error);
    throw error;
  }
};

export const updateTransaction = async (payload: UpdateTransactionPayload): Promise<void> => {
  try {
    const response = await fetch(`${BASE_API_URL}?action=update`, {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
    });

    if (!response.ok) {
      throw new Error(`Error updating transaction: ${response.statusText}`);
    }

    const json = await response.json();
    if (json.status !== 'ok') {
      throw new Error('API returned invalid status for update');
    }
  } catch (error) {
    console.error("Failed to update transaction", error);
    throw error;
  }
};

export const deleteTransaction = async (id: number): Promise<void> => {
  try {
    // Ensure the ID is passed in the query string as requested
    const response = await fetch(`${BASE_API_URL}?action=delete&id=${id}`, {
      method: 'POST',
      // Sending an empty body to ensure it's treated as a POST by the GAS `doPost` trigger,
      // though parameters are in the URL.
      body: JSON.stringify({}), 
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
    });

    if (!response.ok) {
      throw new Error(`Error deleting transaction: ${response.statusText}`);
    }

    const json = await response.json();
    if (json.status !== 'ok') {
      throw new Error('API returned invalid status for deletion');
    }
  } catch (error) {
    console.error("Failed to delete transaction", error);
    throw error;
  }
};
