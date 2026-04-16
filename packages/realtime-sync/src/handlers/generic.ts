import type { Request, Response } from 'express';

export function handleAck(_req: Request, res: Response): void {
  // Acknowledge without processing — frontend has no listener for this topic yet
  res.status(204).send();
}
