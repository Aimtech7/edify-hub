import React, { useState } from 'react';

interface Book {
  id: number;
  title: string;
  author: string;
  barcode: string;
  category: string;
  book_format: string;
  available_copies: number;
  pdf_file?: string;
}

interface ResearchPaper {
  id: number;
  title: string;
  authors: string;
  publication_year: number;
  category: string;
  pdf_file: string;
}

interface PastPaper {
  id: number;
  title: string;
  year: number;
  semester: string;
  pdf_file: string;
  solution_file?: string;
}

interface DigitalLibraryPortalProps {
  books?: Book[];
  papers?: ResearchPaper[];
  pastPapers?: PastPaper[];
  onBorrowBook?: (bookId: number) => void;
}

export const DigitalLibraryPortal: React.FC<DigitalLibraryPortalProps> = ({
  books = [],
  papers = [],
  pastPapers = [],
  onBorrowBook
}) => {
  const [activeTab, setActiveTab] = useState<'BOOKS' | 'PAPERS' | 'PAST_PAPERS'>('BOOKS');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredBooks = books.filter(b => 
    b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.barcode.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredPapers = papers.filter(p =>
    p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.authors.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredPastPapers = pastPapers.filter(pp =>
    pp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    pp.year.toString().includes(searchQuery)
  );

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-8 rounded-2xl border border-indigo-500/30 shadow-2xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-indigo-300">
              📚 Enterprise Digital & Physical Library
            </h1>
            <p className="text-sm text-slate-300 mt-2">
              Browse German language textbooks, academic linguistic journals, Goethe-Institut exam past papers, and audio recordings.
            </p>
          </div>
          <div className="w-full md:w-80">
            <input
              type="text"
              placeholder="🔍 Search titles, authors, barcodes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-amber-400 text-white placeholder-slate-400 shadow-inner"
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-4 mt-8 border-b border-slate-800">
          <button
            onClick={() => setActiveTab('BOOKS')}
            className={`pb-3 px-4 font-semibold text-sm transition border-b-2 ${
              activeTab === 'BOOKS'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            📖 Textbooks & eBooks ({filteredBooks.length})
          </button>
          <button
            onClick={() => setActiveTab('PAPERS')}
            className={`pb-3 px-4 font-semibold text-sm transition border-b-2 ${
              activeTab === 'PAPERS'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            🔬 Research Papers ({filteredPapers.length})
          </button>
          <button
            onClick={() => setActiveTab('PAST_PAPERS')}
            className={`pb-3 px-4 font-semibold text-sm transition border-b-2 ${
              activeTab === 'PAST_PAPERS'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            📝 Exam Past Papers ({filteredPastPapers.length})
          </button>
        </div>
      </div>

      {/* Content Grid */}
      <div className="max-w-7xl mx-auto">
        {activeTab === 'BOOKS' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBooks.map((book) => (
              <div
                key={book.id}
                className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col justify-between hover:border-indigo-500/50 transition shadow-lg group"
              >
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-xs font-mono bg-slate-800 text-indigo-300 px-2.5 py-1 rounded border border-slate-700">
                      {book.barcode}
                    </span>
                    <span className={`text-xs px-2.5 py-1 rounded font-bold ${
                      book.available_copies > 0 ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-rose-950 text-rose-400 border border-rose-800'
                    }`}>
                      {book.available_copies} Available
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white group-hover:text-amber-400 transition">{book.title}</h3>
                  <p className="text-sm text-slate-400 mt-1">By {book.author}</p>
                  <p className="text-xs text-slate-500 mt-2 italic">{book.category} • {book.book_format}</p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-800 flex gap-2">
                  {onBorrowBook && book.available_copies > 0 && (
                    <button
                      onClick={() => onBorrowBook(book.id)}
                      className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-2 rounded-lg text-xs font-bold shadow transition"
                    >
                      📦 Borrow Physical Copy
                    </button>
                  )}
                  {book.pdf_file && (
                    <a
                      href={book.pdf_file}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-950 py-2 rounded-lg text-xs font-bold text-center shadow transition"
                    >
                      📄 Download PDF
                    </a>
                  )}
                </div>
              </div>
            ))}
            {filteredBooks.length === 0 && (
              <div className="col-span-full text-center py-16 text-slate-500">
                No textbooks or eBooks match your search query.
              </div>
            )}
          </div>
        )}

        {activeTab === 'PAPERS' && (
          <div className="space-y-4">
            {filteredPapers.map((paper) => (
              <div key={paper.id} className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex justify-between items-center hover:border-indigo-500/50 transition">
                <div>
                  <h3 className="text-lg font-bold text-white">{paper.title}</h3>
                  <p className="text-sm text-slate-400 mt-1">Authors: {paper.authors} ({paper.publication_year})</p>
                  <span className="inline-block mt-2 text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
                    {paper.category}
                  </span>
                </div>
                <a
                  href={paper.pdf_file}
                  target="_blank"
                  rel="noreferrer"
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 px-5 py-2.5 rounded-lg text-sm font-bold shadow transition shrink-0"
                >
                  📥 Read Journal PDF
                </a>
              </div>
            ))}
            {filteredPapers.length === 0 && (
              <div className="text-center py-16 text-slate-500">No research papers match your search query.</div>
            )}
          </div>
        )}

        {activeTab === 'PAST_PAPERS' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredPastPapers.map((pp) => (
              <div key={pp.id} className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white">{pp.title}</h3>
                  <p className="text-sm text-slate-400 mt-1">Year: {pp.year} • {pp.semester}</p>
                </div>
                <div className="mt-6 flex gap-3">
                  <a
                    href={pp.pdf_file}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-2 rounded-lg text-xs font-bold text-center border border-slate-700 transition"
                  >
                    📝 Exam Question Paper
                  </a>
                  {pp.solution_file && (
                    <a
                      href={pp.solution_file}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-2 rounded-lg text-xs font-bold text-center shadow transition"
                    >
                      ✅ Answer Key / Rubric
                    </a>
                  )}
                </div>
              </div>
            ))}
            {filteredPastPapers.length === 0 && (
              <div className="col-span-full text-center py-16 text-slate-500">No exam past papers found.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
