import React from 'react';
import { DigitalLibraryPortal } from '../../components/library/DigitalLibraryPortal';

export const DigitalLibraryPage: React.FC = () => {
  const sampleBooks = [
    {
      id: 1,
      title: 'Grammatik Aktiv C1',
      author: 'Friederike Jin',
      barcode: 'LIB-GER-001',
      category: 'Grammar',
      book_format: 'BOTH',
      available_copies: 3,
      pdf_file: '#'
    },
    {
      id: 2,
      title: 'Aspekte Neu B2 Lehrbuch',
      author: 'Ute Koithan',
      barcode: 'LIB-GER-002',
      category: 'Coursebook',
      book_format: 'PHYSICAL',
      available_copies: 1
    },
    {
      id: 3,
      title: 'Die Verwandlung (Annotated Edition)',
      author: 'Franz Kafka',
      barcode: 'LIB-LIT-005',
      category: 'Literature',
      book_format: 'DIGITAL',
      available_copies: 10,
      pdf_file: '#'
    }
  ];

  const samplePapers = [
    {
      id: 1,
      title: 'Acquisition of German Modal Particles in Adult L2 Learners',
      authors: 'Dr. H. Schmidt, M. Weber',
      publication_year: 2025,
      category: 'Linguistics',
      pdf_file: '#'
    }
  ];

  const samplePastPapers = [
    {
      id: 1,
      title: 'Goethe-Zertifikat C1 Modellprüfung',
      year: 2025,
      semester: 'Winter Semester',
      pdf_file: '#',
      solution_file: '#'
    }
  ];

  const handleBorrow = (bookId: number) => {
    alert(`Borrow request initiated for book ID ${bookId}`);
  };

  return (
    <DigitalLibraryPortal
      books={sampleBooks}
      papers={samplePapers}
      pastPapers={samplePastPapers}
      onBorrowBook={handleBorrow}
    />
  );
};
