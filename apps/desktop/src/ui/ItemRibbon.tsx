import { useState, useRef, useCallback, useMemo } from 'react';
import type { GameItem } from '../game/items';
import { getAvailableItems } from '../game/items';
import { findCraftable } from '../game/crafting';

type ItemRibbonProps = {
  level: number;
  onUseItem: (item: GameItem) => void;
  onCraft?: (recipe: any) => void;
  disabled?: boolean;
};

export const ItemRibbon = ({ level, onUseItem, disabled }: ItemRibbonProps) => {
  const items = getAvailableItems(level);
  const [dragItem, setDragItem] = useState<GameItem | null>(null);
  const [dragPos, setDragPos] = useState({ x: 0, y: 0 });
  const [droppedOn, setDroppedOn] = useState<string | null>(null);
  const ribbonRef = useRef<HTMLDivElement>(null);

  const handleDragStart = useCallback((e: React.DragEvent, item: GameItem) => {
    if (disabled) return;
    setDragItem(item);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', item.id);
    // Create a small ghost image
    const ghost = document.createElement('div');
    ghost.textContent = item.icon;
    ghost.style.fontSize = '2rem';
    ghost.style.position = 'absolute';
    ghost.style.top = '-1000px';
    document.body.appendChild(ghost);
    e.dataTransfer.setDragImage(ghost, 16, 16);
    setTimeout(() => document.body.removeChild(ghost), 0);
  }, [disabled]);

  const handleDragEnd = useCallback(() => {
    setDragItem(null);
    setDroppedOn(null);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragPos({ x: e.clientX, y: e.clientY });
  }, []);

  // Handle drop on the pet viewport area
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const itemId = e.dataTransfer.getData('text/plain');
    const item = items.find((i) => i.id === itemId);
    if (item) {
      onUseItem(item);
      setDroppedOn(itemId);
      setTimeout(() => setDroppedOn(null), 600);
    }
    setDragItem(null);
  }, [items, onUseItem]);

  const craftable = useMemo(() => findCraftable(items.map(i=>i.id), level), [items, level]);

  if (items.length === 0) return null;

  return (
    <>
      {/* Drop zone overlay on pet area */}
      <div
        className="item-drop-zone"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      />

      {/* Item ribbon */}
      <div ref={ribbonRef} className="item-ribbon">
        <span className="item-ribbon__label">Items</span>
        <div className="item-ribbon__items">
          {items.map((item) => (
            <div
              key={item.id}
              className={`item-chip ${droppedOn === item.id ? 'item-chip--used' : ''} ${disabled ? 'item-chip--disabled' : ''}`}
              draggable={!disabled}
              onDragStart={(e) => handleDragStart(e, item)}
              onDragEnd={handleDragEnd}
              onClick={() => !disabled && onUseItem(item)}
              title={`${item.name}: ${item.description} (${item.stageName})`}
            >
              <span className="item-chip__icon">{item.icon}</span>
              <span className="item-chip__name">{item.name}</span>
              <span className="item-chip__stage">{item.stageName}</span>
            </div>
          ))}
        </div>
        {/* Craftable combos hint */}
        {craftable.length > 0 && (
          <div className="item-ribbon__craftable">
            🧪 {craftable[0].icon} <strong>{craftable[0].name}</strong> craftable!
          </div>
        )}
      </div>

      {/* Drag ghost indicator */}
      {dragItem && (
        <div
          className="item-drag-ghost"
          style={{ left: dragPos.x - 20, top: dragPos.y - 20 }}
        >
          {dragItem.icon}
        </div>
      )}
    </>
  );
};
