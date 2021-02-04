import React, { useEffect, useRef, useState } from "react";

import "./App.css";
import { Fruit, Row, SnakeComponent, Square } from "./styles";

const TICK_SNAKE_SPEED = 300;
const TICK_GAME = 100;
const TICK_FRUIT_GENERATION = 2000;

interface IPosition {
  row: number;
  column: number;
}

type ISnake = IPosition[];
type IFruit = IPosition[];

enum enDirection {
  "right" = "right",
  "left" = "left",
  "up" = "up",
  "down" = "down",
}

function getNextDirection(current: IPosition, next: IPosition) {
  if (current.row !== next.row) {
    if (next.row > current.row) {
      return enDirection.down;
    }

    return enDirection.up;
  }
  if (current.column !== next.column) {
    if (next.column > current.column) {
      return enDirection.right;
    }

    return enDirection.left;
  }
}

function getNextPosition(current: IPosition, next: IPosition): IPosition {
  const direction = getNextDirection(current, next);

  return getPartUpdated(current, direction);
}

function getPartUpdated(
  part: IPosition,
  direction: enDirection | undefined
): IPosition {
  if (direction) {
    if (direction === enDirection.up) {
      return { row: part.row - 1, column: part.column };
    }

    if (direction === enDirection.down) {
      return { row: part.row + 1, column: part.column };
    }

    if (direction === enDirection.right) {
      return { row: part.row, column: part.column + 1 };
    }

    if (direction === enDirection.left) {
      return { row: part.row, column: part.column - 1 };
    }
  }
  return part;
}

function shouldRenderElement(item: ISnake | IFruit, currentSquare: IPosition) {
  return item.some(
    (part) =>
      part.column === currentSquare.column && part.row === currentSquare.row
  );
}

function getNextSnake(snake: ISnake, direction: enDirection) {
  const head: IPosition = getPartUpdated(
    {
      row: snake[0].row,
      column: snake[0].column,
    },
    direction
  );

  let body: IPosition[] = [];
  for (let index = 1; index < snake.length; index++) {
    if (index === 1) {
      body.push(getNextPosition(snake[index], snake[0]));
      continue;
    }

    body.push(getNextPosition(snake[index], snake[index - 1]));
  }

  return [head, ...body];
}

function board() {
  return new Array(BOARD_LENGTH).fill(true);
}

const BOARD_LENGTH = 30;

function handleKeyPress(event: React.KeyboardEvent<HTMLDivElement>) {
  if (event.key === "ArrowRight") {
    return enDirection.right;
  }
  if (event.key === "ArrowLeft") {
    return enDirection.left;
  }
  if (event.key === "ArrowUp") {
    return enDirection.up;
  }
  if (event.key === "ArrowDown") {
    return enDirection.down;
  }

  return enDirection.right;
}

function getRandomBoardPosition() {
  return Math.floor(Math.random() * BOARD_LENGTH + 1);
}
function getRandomPosition(): IPosition {
  return { column: getRandomBoardPosition(), row: getRandomBoardPosition() };
}

function getFruitToEat(snake: ISnake, fruits: IFruit) {
  const head = snake[0];

  return fruits.find(
    (fruit) => fruit.column === head.column && fruit.row === head.row
  );
}

function App() {
  const [snake, setSnake] = useState<ISnake>([
    { row: 0, column: 2 },
    { row: 0, column: 1 },
    { row: 0, column: 0 },
  ]);
  const direction = useRef(enDirection.right);
  const [fruits, setFruits] = useState<IFruit>([]);

  useEffect(() => {
    const intervalGame = setInterval(() => {
      const fruitEaten = getFruitToEat(snake, fruits);

      if (fruitEaten) {
        setSnake((prev) => {
          const lastPart = prev[prev.length - 1];
          return [...prev, getPartUpdated(lastPart, direction.current)];
        });
        setFruits((prev) =>
          prev.filter(
            (fruit) =>
              fruit.column !== fruitEaten.column && fruit.row !== fruitEaten.row
          )
        );
      }
    }, TICK_GAME);
    return () => {
      clearInterval(intervalGame);
    };
  }, [fruits, snake]);

  useEffect(() => {
    console.log(" aaa");

    const intervalSnakeSpeed = setInterval(() => {
      setSnake((prev) => getNextSnake(prev, direction.current));
    }, TICK_SNAKE_SPEED);

    const intervalFruits = setInterval(() => {
      setFruits((prev) => [...prev, getRandomPosition()]);
    }, TICK_FRUIT_GENERATION);

    return () => {
      console.log(" unmounted");

      clearInterval(intervalSnakeSpeed);
      clearInterval(intervalFruits);
    };
  }, [direction]);

  return (
    <div
      className="App"
      tabIndex={0}
      onKeyDown={(ev) => {
        direction.current = handleKeyPress(ev);
      }}
    >
      {board().map((_, rowIndex) => {
        const row = board().map((_, columnIndex) => {
          const key = `${rowIndex}-${columnIndex}`;
          const currentCell = { row: rowIndex, column: columnIndex };

          if (shouldRenderElement(snake, currentCell))
            return <SnakeComponent key={key} />;

          if (shouldRenderElement(fruits, currentCell))
            return <Fruit key={key} />;

          return <Square key={key} />;
        });

        return <Row key={rowIndex}>{row}</Row>;
      })}
    </div>
  );
}

export default App;
