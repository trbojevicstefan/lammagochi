/** 2-bone Inverse Kinematics solver for natural limb reaching */

export interface Point { x: number; y: number; }

export interface IKResult {
  jointAngle: number;   // angle at mid joint (elbow/knee)
  rootAngle: number;    // angle at root (shoulder/hip)
  jointPos: Point;      // position of mid joint
  endPos: Point;        // position of end effector (hand/foot)
  reached: boolean;     // true if target was reachable
}

/**
 * Solve 2-bone IK chain:
 *   root (fixed) → mid → end (target)
 *
 * @param root — fixed anchor point (shoulder/hip)
 * @param target — desired end position (hand/foot target)
 * @param len1 — upper segment length
 * @param len2 — lower segment length
 * @param bendDir — 1 = bend forward, -1 = bend backward
 */
export const solveIK = (
  root: Point, target: Point, len1: number, len2: number, bendDir = 1,
): IKResult => {
  const dx = target.x - root.x;
  const dy = target.y - root.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const maxReach = len1 + len2;
  const reached = dist <= maxReach;

  // Clamp target if unreachable
  let tx = target.x, ty = target.y;
  if (dist > maxReach) {
    const scale = maxReach / dist;
    tx = root.x + dx * scale;
    ty = root.y + dy * scale;
  }

  // Law of cosines for elbow angle
  const cosElbow = (len1 * len1 + len2 * len2 - dist * dist) / (2 * len1 * len2);
  const elbowAngle = Math.acos(Math.max(-1, Math.min(1, cosElbow))) * bendDir;

  // Angle from root to target
  const baseAngle = Math.atan2(ty - root.y, tx - root.x);

  // Angle from root to elbow (law of sines)
  const elbowHeight = len2 * Math.sin(elbowAngle);
  const elbowDist = len1 - len2 * Math.cos(elbowAngle);
  const jointAngle = Math.atan2(elbowHeight, elbowDist);

  const rootAngle = baseAngle - jointAngle;

  // Compute joint positions
  const jointPos: Point = {
    x: root.x + Math.cos(rootAngle) * len1,
    y: root.y + Math.sin(rootAngle) * len1,
  };

  const endPos: Point = {
    x: root.x + Math.cos(rootAngle + jointAngle) * len2 + Math.cos(rootAngle) * len1,
    y: root.y + Math.sin(rootAngle + jointAngle) * len2 + Math.sin(rootAngle) * len1,
  };

  return { jointAngle, rootAngle, jointPos, endPos, reached };
};
