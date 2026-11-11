import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { menuStructure } from '../GestionSidebar';

const NavigationSearchModal = ({ isOpen, onClose }) => {
  const { hasPermission, user } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  const checkPerm = (perm) => {
    if (!perm) return true;
    if (Array.isArray(perm)) return perm.some((p) => hasPermission(p));
    return hasPermission(perm);
  };

  // Extraer todos los apartados a los que el usuario tiene acceso según sus permisos y rol
  const accessibleItems = useMemo(() => {
    const list = [];
    menuStructure.forEach((item) => {
      // 1. Enlace directo
      if (item.type === 'link') {
        const allowed =
          (!item.permission || checkPerm(item.permission)) &&
          (!item.adminOnly || user?.role === 'ADMIN');
        if (allowed) {
          list.push({
            id: item.path,
            name: item.name,
            path: item.path,
            icon: item.icon,
            group: 'Principal',
          });
        }
      }

      // 2. Grupos de apartados
      if (item.type === 'group' && Array.isArray(item.children)) {
        const groupAllowed =
          (!item.permission || checkPerm(item.permission)) &&
          (!item.adminOnly || user?.role === 'ADMIN');

        if (groupAllowed) {
          item.children.forEach((child) => {
            const childAllowed =
              (!child.permission || checkPerm(child.permission)) &&
              (!child.adminOnly || user?.role === 'ADMIN');

            if (childAllowed) {
              const fullPath = child.path.startsWith('/')
                ? child.path
                : `/gestion/${child.path}`;
              list.push({
                id: `${item.name}-${child.name}`,
                name: child.name,
                path: fullPath,
                icon: child.icon,
                group: item.name,
              });
            }
          });
        }
      }
    });
    return list;
  }, [hasPermission, user]);

  // Normalizar texto para búsqueda insensible a acentos
  const normalize = (str) =>
    (str || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

  const filteredItems = useMemo(() => {
    if (!query.trim()) return accessibleItems;
    const q = normalize(query.trim());
    return accessibleItems.filter(
      (item) => normalize(item.name).includes(q) || normalize(item.group).includes(q)
    );
  }, [accessibleItems, query]);

  // Reset del índice seleccionado cuando cambian los resultados
  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredItems]);

  // Autofoco al abrir y reset de query
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleSelect = (item) => {
    if (!item) return;
    onClose();
    navigate(item.path);
  };

  // Manejo de teclado (flechas arriba/abajo, Enter, Escape)
  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % (filteredItems.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % (filteredItems.length || 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        handleSelect(filteredItems[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  // Scroll automático hacia el elemento seleccionado
  useEffect(() => {
    if (listRef.current && filteredItems.length > 0) {
      const activeEl = listRef.current.children[selectedIndex];
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex, filteredItems]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-start justify-center p-4 sm:p-6 md:p-10 pt-[max(2rem,env(safe-area-inset-top,0px))] bg-black/60 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-white/95 dark:bg-gray-900/95 backdrop-blur-2xl rounded-3xl shadow-2xl border border-gray-200/80 dark:border-gray-800 overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Cabecera del Buscador con Input */}
        <div className="p-4 sm:p-5 border-b border-gray-100 dark:border-gray-800/80 flex items-center gap-3">
          <span className="material-symbols-outlined text-2xl text-primary flex-shrink-0">
            search
          </span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar apartado por nombre o área..."
            className="flex-1 bg-transparent text-sm sm:text-base font-semibold text-gray-900 dark:text-white placeholder-gray-400 outline-none"
            aria-label="Buscar apartado"
          />
          {query ? (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                inputRef.current?.focus();
              }}
              className="h-7 w-7 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              title="Borrar texto"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          ) : (
            <kbd className="hidden sm:inline-flex items-center px-2 py-0.5 text-[10px] font-mono font-bold text-gray-400 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
              ESC
            </kbd>
          )}
        </div>

        {/* Lista de Resultados Filtrados por Permisos */}
        <div
          ref={listRef}
          className="flex-1 overflow-y-auto p-2 sm:p-3 space-y-1 custom-scrollbar min-h-[140px]"
        >
          {filteredItems.length === 0 ? (
            <div className="py-12 px-6 text-center text-gray-400 flex flex-col items-center justify-center">
              <span className="material-symbols-outlined text-4xl mb-2 opacity-40">
                manage_search
              </span>
              <p className="text-sm font-bold text-gray-700 dark:text-gray-300">
                No se encontraron apartados
              </p>
              <p className="text-xs text-gray-400 mt-1 max-w-xs">
                Verifica el nombre o asegúrate de contar con los permisos requeridos para acceder.
              </p>
            </div>
          ) : (
            filteredItems.map((item, index) => {
              const isSelected = index === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`flex items-center justify-between p-3 rounded-2xl cursor-pointer transition-all duration-100 active:scale-[0.98] ${
                    isSelected
                      ? 'bg-primary text-white shadow-md shadow-primary/25'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-800/60 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                        isSelected
                          ? 'bg-white/20 text-white'
                          : 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-blue-300'
                      }`}
                    >
                      <span className="material-symbols-outlined text-xl">{item.icon}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p
                        className={`text-sm font-bold truncate leading-tight ${
                          isSelected ? 'text-white' : 'text-gray-900 dark:text-white'
                        }`}
                      >
                        {item.name}
                      </p>
                      <p
                        className={`text-[10px] font-semibold uppercase tracking-wider truncate mt-0.5 ${
                          isSelected ? 'text-white/80' : 'text-gray-400 dark:text-gray-500'
                        }`}
                      >
                        {item.group}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                    {isSelected ? (
                      <span className="hidden sm:inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-md bg-white/20 text-white">
                        Enter ↵
                      </span>
                    ) : (
                      <span className="material-symbols-outlined text-base text-gray-400 opacity-60">
                        arrow_forward
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pie con atajos útiles e indicador de apartados disponibles */}
        <div className="p-3 px-5 border-t border-gray-100 dark:border-gray-800/80 bg-gray-50/60 dark:bg-gray-900/60 flex items-center justify-between text-[11px] text-gray-400 select-none">
          <span className="font-semibold">
            {filteredItems.length} apartado{filteredItems.length !== 1 ? 's' : ''} disponible{filteredItems.length !== 1 ? 's' : ''}
          </span>
          <div className="hidden sm:flex items-center gap-3">
            <span>↑↓ Navegar</span>
            <span>↵ Abrir</span>
            <span>Esc Salir</span>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default NavigationSearchModal;
