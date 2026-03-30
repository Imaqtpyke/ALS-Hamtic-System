import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Notification from '../Notification';

describe('Notification', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders success notification', () => {
    render(
      <Notification
        message="Success message"
        type="success"
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('Success message')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('renders error notification', () => {
    render(
      <Notification
        message="Error message"
        type="error"
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('Error message')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    render(
      <Notification
        message="Test message"
        type="info"
        onClose={mockOnClose}
      />
    );

    fireEvent.click(screen.getByRole('button'));
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('auto-closes after duration', () => {
    jest.useFakeTimers();
    
    render(
      <Notification
        message="Test message"
        type="info"
        duration={3000}
        onClose={mockOnClose}
      />
    );

    jest.advanceTimersByTime(3000);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
    
    jest.useRealTimers();
  });
}); 