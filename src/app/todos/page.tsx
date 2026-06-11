'use client';

import { useState, useEffect } from 'react';
import { ChevronUp, ChevronDown, Plus, CheckSquare, ListTodo, Circle, CheckCircle2, MoreHorizontal, RotateCw } from 'lucide-react';
import { useSession } from 'next-auth/react';

export default function TodosPage() {
  const { status } = useSession();
  const [todos, setTodos] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Collapse state
  const [todayOpen, setTodayOpen] = useState(true);
  const [laterOpen, setLaterOpen] = useState(true);
  const [completedOpen, setCompletedOpen] = useState(false);

  // New task inline state
  const [addingTo, setAddingTo] = useState<'today' | 'later' | null>(null);
  const [newTaskText, setNewTaskText] = useState('');

  useEffect(() => {
    if (status !== 'loading') {
      fetchTodos();
    }
  }, [status]);

  const fetchTodos = async () => {
    if (status !== 'authenticated') {
      const localTodos = JSON.parse(localStorage.getItem('guest_todos') || '[]');
      setTodos(localTodos);
      setIsLoading(false);
      return;
    }
    try {
      const res = await fetch('/api/todos');
      if (res.ok) {
        const data = await res.json();
        setTodos(data.todos);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleComplete = async (todo: any) => {
    const isDone = !todo.done;
    
    if (status !== 'authenticated') {
      const updatedTodos = todos.map(t => 
        t._id === todo._id ? { ...t, done: isDone, completed: isDone } : t
      );
      setTodos(updatedTodos);
      localStorage.setItem('guest_todos', JSON.stringify(updatedTodos));
      return;
    }

    setTodos(prev => prev.map(t => 
      t._id === todo._id ? { ...t, done: isDone, completed: isDone } : t
    ));

    try {
      await fetch('/api/todos', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          sessionId: todo.sessionId, 
          todoId: todo._id, 
          updates: { done: isDone } 
        }),
      });
    } catch (err) {
      console.error(err);
      fetchTodos();
    }
  };

  const handleAddNewTask = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && newTaskText.trim() && addingTo) {
      const text = newTaskText.trim();
      setNewTaskText('');
      setAddingTo(null);
      
      if (status !== 'authenticated') {
        const newTodo = {
          _id: Date.now().toString(),
          text,
          type: 'task',
          timing: addingTo,
          done: false,
          completed: false,
          createdAt: new Date().toISOString()
        };
        const updatedTodos = [newTodo, ...todos];
        setTodos(updatedTodos);
        localStorage.setItem('guest_todos', JSON.stringify(updatedTodos));
        return;
      }
      
      try {
        const res = await fetch('/api/todos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text,
            type: 'task',
            timing: addingTo
          }),
        });
        if (res.ok) {
          const { todo } = await res.json();
          setTodos(prev => [todo, ...prev]);
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  if (status === 'loading' || isLoading) {
    return <div className="flex h-screen items-center justify-center bg-slate-50"><div className="animate-spin text-sky-600"><RotateCw className="w-6 h-6" /></div></div>;
  }

  // Categorize
  const todayTodos = todos.filter(t => t.timing === 'today' && !t.done);
  const laterTodos = todos.filter(t => t.timing === 'later' && !t.done);
  const completedTodos = todos.filter(t => t.done);

  const incompleteCount = todayTodos.length + laterTodos.length;

  return (
    <div className="flex flex-col flex-1 w-full bg-slate-50 text-slate-900 font-sans relative overflow-hidden">
      {/* Header */}
      <header className="px-5 py-4 border-b border-slate-200 flex items-center justify-between flex-none bg-white shadow-sm">
        <div className="flex items-center gap-2">
          <ListTodo className="w-5 h-5 text-sky-600" />
          <h1 className="text-base font-bold tracking-tight text-[#0f2e4a]">To-do List</h1>
        </div>
      </header>

      {/* Main scrollable list */}
      <main className="flex-1 overflow-y-auto px-5 py-6 pb-32 custom-scrollbar">
        
        {/* SECTION: TODAY */}
        <div className="mb-8">
          <button 
            onClick={() => setTodayOpen(!todayOpen)} 
            className="flex items-center justify-between w-full text-left mb-4 group"
          >
            <h2 className="text-lg font-bold text-[#0f2e4a] tracking-tight">Today</h2>
            <div className="text-slate-400 group-hover:text-slate-600 transition-colors">
              {todayOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </div>
          </button>

          {todayOpen && (
            <div className="space-y-0.5">
              {/* Add New Row */}
              <div 
                className="flex items-center gap-3 py-3 group cursor-text"
                onClick={() => setAddingTo('today')}
              >
                <div className="w-5 h-5 rounded flex items-center justify-center border border-slate-200 text-slate-400 bg-white">
                  <Plus className="w-3.5 h-3.5" />
                </div>
                {addingTo === 'today' ? (
                  <input 
                    autoFocus
                    type="text"
                    value={newTaskText}
                    onChange={(e) => setNewTaskText(e.target.value)}
                    onKeyDown={handleAddNewTask}
                    onBlur={() => { setAddingTo(null); setNewTaskText(''); }}
                    className="flex-1 bg-transparent border-none outline-none text-sm text-slate-800 placeholder-slate-400"
                    placeholder="Type task and press enter..."
                  />
                ) : (
                  <span className="text-sm font-medium text-sky-600">Add a new task to To-do list</span>
                )}
              </div>

              {todayTodos.map((todo) => (
                <div key={todo._id} className="flex items-center justify-between py-3 border-b border-slate-100 group">
                  <div className="flex items-start gap-3">
                    <button onClick={() => toggleComplete(todo)} className="mt-0.5 text-slate-300 hover:text-sky-600 transition-colors">
                      <div className="w-5 h-5 rounded border border-slate-300 group-hover:border-sky-600" />
                    </button>
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-slate-800 font-medium">{todo.text}</span>
                        {todo.type === 'goal' ? (
                          <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-purple-50 text-purple-600 border border-purple-100">Goal</span>
                        ) : (
                          <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-600 border border-emerald-100">Task</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SECTION: LATER */}
        <div className="mb-8">
          <button 
            onClick={() => setLaterOpen(!laterOpen)} 
            className="flex items-center justify-between w-full text-left mb-4 group"
          >
            <h2 className="text-lg font-bold text-[#0f2e4a] tracking-tight">Later</h2>
            <div className="text-slate-400 group-hover:text-slate-600 transition-colors">
              {laterOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </div>
          </button>

          {laterOpen && (
            <div className="space-y-0.5">
              <div 
                className="flex items-center gap-3 py-3 group cursor-text border-b border-slate-100"
                onClick={() => setAddingTo('later')}
              >
                <div className="w-5 h-5 rounded flex items-center justify-center border border-slate-200 text-slate-400 bg-white">
                  <Plus className="w-3.5 h-3.5" />
                </div>
                {addingTo === 'later' ? (
                  <input 
                    autoFocus
                    type="text"
                    value={newTaskText}
                    onChange={(e) => setNewTaskText(e.target.value)}
                    onKeyDown={handleAddNewTask}
                    onBlur={() => { setAddingTo(null); setNewTaskText(''); }}
                    className="flex-1 bg-transparent border-none outline-none text-sm text-slate-800 placeholder-slate-400"
                    placeholder="Type task and press enter..."
                  />
                ) : (
                  <span className="text-sm font-medium text-slate-400">Add to Later</span>
                )}
              </div>

              {laterTodos.map((todo) => (
                <div key={todo._id} className="flex items-center justify-between py-3 border-b border-slate-100 group">
                  <div className="flex items-start gap-3">
                    <button onClick={() => toggleComplete(todo)} className="mt-0.5 text-slate-300 hover:text-sky-600 transition-colors">
                      <div className="w-5 h-5 rounded border border-slate-300 group-hover:border-sky-600" />
                    </button>
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-slate-800 font-medium">{todo.text}</span>
                        {todo.type === 'goal' ? (
                          <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-purple-50 text-purple-600 border border-purple-100">Goal</span>
                        ) : (
                          <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-600 border border-emerald-100">Task</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SECTION: COMPLETED */}
        <div className="mb-8">
          <button 
            onClick={() => setCompletedOpen(!completedOpen)} 
            className="flex items-center justify-between w-full text-left mb-4 group"
          >
            <h2 className="text-lg font-bold text-[#0f2e4a] tracking-tight">Completed</h2>
            <div className="text-slate-400 group-hover:text-slate-600 transition-colors">
              {completedOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </div>
          </button>

          {completedOpen && (
            <div className="space-y-0.5">
              {completedTodos.length === 0 && (
                <p className="text-sm text-slate-400 py-2">No completed tasks yet.</p>
              )}
              {completedTodos.map((todo) => (
                <div key={todo._id} className="flex items-center justify-between py-3 border-b border-slate-100">
                  <div className="flex items-start gap-3 opacity-60">
                    <button onClick={() => toggleComplete(todo)} className="mt-0.5 text-sky-600">
                      <CheckCircle2 className="w-5 h-5" />
                    </button>
                    <span className="text-sm text-slate-500 line-through">{todo.text}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </main>

      {/* Bottom Action Bar */}
      <div className="absolute bottom-6 left-0 right-0 px-5 flex items-center justify-between gap-3 pointer-events-none">
        <div className="pointer-events-auto flex-1 max-w-[200px]">
          <button className="flex items-center justify-center gap-2 w-full py-3.5 bg-white hover:bg-slate-50 text-[#0f2e4a] border border-slate-200 rounded-full text-sm font-bold transition-colors shadow-lg">
            <ListTodo className="w-4 h-4 text-sky-600" />
            Review {incompleteCount} Tasks
          </button>
        </div>
        <div className="pointer-events-auto flex-none">
          <button 
            onClick={() => setAddingTo('today')}
            className="flex items-center justify-center gap-2 px-6 py-3.5 bg-[#0f2e4a] hover:bg-[#1a3f61] text-white rounded-full text-sm font-bold transition-colors shadow-lg shadow-slate-200"
          >
            <Plus className="w-4 h-4" />
            New
          </button>
        </div>
      </div>
    </div>
  );
}
