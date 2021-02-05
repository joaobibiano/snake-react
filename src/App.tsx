import React, { useCallback, useEffect, useRef, useState } from "react";

import "./App.css";
import { Fruit, Row, SnakeComponent, Square } from "./styles";

let TICK_SNAKE_SPEED = 600;
const TICK_GAME = 200;
const TICK_FRUIT_GENERATION = 2000;
const BOARD_LENGTH = 30;

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
  const head: IPosition = getPartUpdated(snake[0], direction);

  let body: IPosition[] = [];
  for (let index = 1; index < snake.length; index++) {
    body.push(getNextPosition(snake[index], snake[index - 1]));
  }

  return [head, ...body];
}

function board() {
  return new Array(BOARD_LENGTH).fill(true);
}
function keyEventToDirection(event: React.KeyboardEvent<HTMLDivElement>) {
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

function getAllowedMovement(current: enDirection, nextDirection: enDirection) {
  if (current === enDirection.right && nextDirection === enDirection.left) {
    return enDirection.right;
  }
  if (current === enDirection.left && nextDirection === enDirection.right) {
    return enDirection.left;
  }
  if (current === enDirection.down && nextDirection === enDirection.up) {
    return enDirection.down;
  }
  if (current === enDirection.up && nextDirection === enDirection.down) {
    return enDirection.up;
  }

  return nextDirection;
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

function validIfLoose(snake: ISnake) {
  const head = snake[0];
  const ateItSelf = snake
    .filter((_, index) => index !== 0)
    .some((p) => p.column === head.column && p.row === head.row);

  const outsideArea =
    head.column > BOARD_LENGTH ||
    head.column < 0 ||
    head.row > BOARD_LENGTH ||
    head.row < 0;

  return ateItSelf || outsideArea;
}

function App() {
  const loose = useRef(false);
  const score = useRef(0);
  const gameIntervalId = useRef(0);
  const snakeTimeoutId = useRef(0);
  const snake = useRef([
    { row: 0, column: 2 },
    { row: 0, column: 1 },
    { row: 0, column: 0 },
  ]);
  const fruits = useRef<IFruit>([]);
  const direction = useRef(enDirection.right);
  const [, setGame] = useState(false);

  function processEatFruits() {
    const fruitEaten = getFruitToEat(snake.current, fruits.current);

    if (fruitEaten) {
      score.current++;

      if (TICK_SNAKE_SPEED >= 100) {
        TICK_SNAKE_SPEED = TICK_SNAKE_SPEED - 30;
      }

      const lastPart = snake.current[snake.current.length - 1];

      snake.current = [
        ...snake.current,
        getPartUpdated(lastPart, direction.current),
      ];

      const fruitIndex = fruits.current.findIndex(
        (c) => c.row === fruitEaten.row && c.column === fruitEaten.column
      );
      fruits.current.splice(fruitIndex, 1);
    }
  }

  useEffect(() => {
    gameIntervalId.current = window.setInterval(() => {
      processEatFruits();
      loose.current = validIfLoose(snake.current);

      if (loose.current) {
        clearInterval(gameIntervalId.current);
      }
      setGame((prev) => !prev);
    }, TICK_GAME);
    return () => {
      clearInterval(gameIntervalId.current);
    };
  }, []);

  useEffect(() => {
    function processSnake() {
      snake.current = getNextSnake(snake.current, direction.current);

      snakeTimeoutId.current = window.setTimeout(() => {
        processSnake();
      }, TICK_SNAKE_SPEED);
    }

    processSnake();

    return () => {
      clearTimeout(snakeTimeoutId.current);
    };
  }, [direction]);

  useEffect(() => {
    const intervalFruits = setInterval(() => {
      fruits.current.push(getRandomPosition());
    }, TICK_FRUIT_GENERATION);

    return () => {
      clearInterval(intervalFruits);
    };
  }, [direction, fruits]);

  const handleKeyPress = useCallback(
    (ev: React.KeyboardEvent<HTMLDivElement>) => {
      direction.current = getAllowedMovement(
        direction.current,
        keyEventToDirection(ev)
      );
    },
    []
  );

  return (
    <div className="App" tabIndex={0} onKeyDown={handleKeyPress}>
      {loose.current && <p>Ohhh nooo</p>}
      Score: {score.current}
      {board().map((_, rowIndex) => {
        const row = board().map((_, columnIndex) => {
          const key = `${rowIndex}-${columnIndex}`;
          const currentCell = { row: rowIndex, column: columnIndex };

          if (shouldRenderElement(snake.current, currentCell))
            return <SnakeComponent key={key} />;

          if (shouldRenderElement(fruits.current, currentCell))
            return <Fruit key={key} />;

          return <Square key={key} />;
        });

        return <Row key={rowIndex}>{row}</Row>;
      })}
    </div>
  );
}

export default App;
