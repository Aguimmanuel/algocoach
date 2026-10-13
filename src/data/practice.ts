/**
 * Real practice problems, one list per pattern.
 *
 * Borrowed from the two things every good algorithm site does that a lesson
 * alone cannot:
 *   - NeetCode's roadmap: a pattern is only learned once you have solved things
 *     with it, so every pattern carries its own problem list.
 *   - VisuAlgo's training component: problems are graded easy / medium / hard so
 *     a beginner knows where to start instead of guessing.
 *
 * Deliberately no links. Names are stable and searchable on whichever judge you
 * prefer, and the app keeps working with no internet — the same reason the rest
 * of AlgoCoach ships offline. The difficulty tag is the honest signal: always
 * clear the Easy ones before touching a Hard one.
 */

export type Difficulty = "Easy" | "Medium" | "Hard";

export interface Problem {
  name: string;
  difficulty: Difficulty;
}

export const DIFFICULTY_STYLE: Record<Difficulty, string> = {
  Easy: "bg-muted text-muted-foreground ring-border",
  Medium: "bg-border text-foreground ring-border",
  Hard: "bg-primary text-primary-foreground ring-border",
};

/** Problems are listed easiest-first, so the list itself is a study order. */
export const PRACTICE: Record<string, Problem[]> = {
  brute: [
    { name: "FizzBuzz", difficulty: "Easy" },
    { name: "Running Sum of 1d Array", difficulty: "Easy" },
    { name: "Spiral Matrix", difficulty: "Medium" },
    { name: "Game of Life", difficulty: "Medium" },
    { name: "Pow(x, n)", difficulty: "Medium" },
  ],
  hashmap: [
    { name: "Two Sum", difficulty: "Easy" },
    { name: "Contains Duplicate", difficulty: "Easy" },
    { name: "Valid Anagram", difficulty: "Easy" },
    { name: "Group Anagrams", difficulty: "Medium" },
    { name: "Top K Frequent Elements", difficulty: "Medium" },
    { name: "Longest Consecutive Sequence", difficulty: "Medium" },
  ],
  "two-pointers": [
    { name: "Valid Palindrome", difficulty: "Easy" },
    { name: "Two Sum II — Input Array Is Sorted", difficulty: "Medium" },
    { name: "3Sum", difficulty: "Medium" },
    { name: "Container With Most Water", difficulty: "Medium" },
    { name: "Trapping Rain Water", difficulty: "Hard" },
  ],
  "sliding-window": [
    { name: "Maximum Average Subarray I", difficulty: "Easy" },
    { name: "Longest Substring Without Repeating Characters", difficulty: "Medium" },
    { name: "Longest Repeating Character Replacement", difficulty: "Medium" },
    { name: "Permutation in String", difficulty: "Medium" },
    { name: "Minimum Window Substring", difficulty: "Hard" },
    { name: "Sliding Window Maximum", difficulty: "Hard" },
  ],
  "binary-search": [
    { name: "Binary Search", difficulty: "Easy" },
    { name: "Search Insert Position", difficulty: "Easy" },
    { name: "Search in Rotated Sorted Array", difficulty: "Medium" },
    { name: "Find Minimum in Rotated Sorted Array", difficulty: "Medium" },
    { name: "Koko Eating Bananas", difficulty: "Medium" },
    { name: "Median of Two Sorted Arrays", difficulty: "Hard" },
  ],
  "prefix-sum": [
    { name: "Range Sum Query — Immutable", difficulty: "Easy" },
    { name: "Find Pivot Index", difficulty: "Easy" },
    { name: "Subarray Sum Equals K", difficulty: "Medium" },
    { name: "Product of Array Except Self", difficulty: "Medium" },
    { name: "Contiguous Array", difficulty: "Medium" },
  ],
  "linked-list": [
    { name: "Reverse Linked List", difficulty: "Easy" },
    { name: "Merge Two Sorted Lists", difficulty: "Easy" },
    { name: "Linked List Cycle", difficulty: "Easy" },
    { name: "Middle of the Linked List", difficulty: "Easy" },
    { name: "Remove Nth Node From End of List", difficulty: "Medium" },
    { name: "LRU Cache", difficulty: "Medium" },
  ],
  sorting: [
    { name: "Sort Colors", difficulty: "Medium" },
    { name: "Merge Intervals", difficulty: "Medium" },
    { name: "Insert Interval", difficulty: "Medium" },
    { name: "Largest Number", difficulty: "Medium" },
    { name: "Non-overlapping Intervals", difficulty: "Medium" },
  ],
  stack: [
    { name: "Valid Parentheses", difficulty: "Easy" },
    { name: "Min Stack", difficulty: "Medium" },
    { name: "Evaluate Reverse Polish Notation", difficulty: "Medium" },
    { name: "Daily Temperatures", difficulty: "Medium" },
    { name: "Largest Rectangle in Histogram", difficulty: "Hard" },
  ],
  bfs: [
    { name: "Flood Fill", difficulty: "Easy" },
    { name: "Shortest Path in Binary Matrix", difficulty: "Medium" },
    { name: "Rotting Oranges", difficulty: "Medium" },
    { name: "01 Matrix", difficulty: "Medium" },
    { name: "Word Ladder", difficulty: "Hard" },
  ],
  dfs: [
    { name: "Number of Islands", difficulty: "Medium" },
    { name: "Max Area of Island", difficulty: "Medium" },
    { name: "Clone Graph", difficulty: "Medium" },
    { name: "Pacific Atlantic Water Flow", difficulty: "Medium" },
    { name: "Course Schedule", difficulty: "Medium" },
  ],
  trees: [
    { name: "Maximum Depth of Binary Tree", difficulty: "Easy" },
    { name: "Same Tree", difficulty: "Easy" },
    { name: "Invert Binary Tree", difficulty: "Easy" },
    { name: "Binary Tree Level Order Traversal", difficulty: "Medium" },
    { name: "Validate Binary Search Tree", difficulty: "Medium" },
    { name: "Lowest Common Ancestor of a Binary Tree", difficulty: "Medium" },
  ],
  intervals: [
    { name: "Merge Intervals", difficulty: "Medium" },
    { name: "Insert Interval", difficulty: "Medium" },
    { name: "Non-overlapping Intervals", difficulty: "Medium" },
    { name: "Meeting Rooms", difficulty: "Medium" },
    { name: "Meeting Rooms II", difficulty: "Medium" },
  ],
  backtracking: [
    { name: "Subsets", difficulty: "Medium" },
    { name: "Combination Sum", difficulty: "Medium" },
    { name: "Permutations", difficulty: "Medium" },
    { name: "Word Search", difficulty: "Medium" },
    { name: "Letter Combinations of a Phone Number", difficulty: "Medium" },
    { name: "N-Queens", difficulty: "Hard" },
  ],
  dp: [
    { name: "Climbing Stairs", difficulty: "Easy" },
    { name: "House Robber", difficulty: "Medium" },
    { name: "Coin Change", difficulty: "Medium" },
    { name: "Longest Common Subsequence", difficulty: "Medium" },
    { name: "Longest Increasing Subsequence", difficulty: "Medium" },
    { name: "Edit Distance", difficulty: "Medium" },
  ],
  greedy: [
    { name: "Best Time to Buy and Sell Stock II", difficulty: "Medium" },
    { name: "Jump Game", difficulty: "Medium" },
    { name: "Gas Station", difficulty: "Medium" },
    { name: "Task Scheduler", difficulty: "Medium" },
    { name: "Merge Triplets to Form Target Triplet", difficulty: "Medium" },
  ],
  heap: [
    { name: "Kth Largest Element in an Array", difficulty: "Medium" },
    { name: "K Closest Points to Origin", difficulty: "Medium" },
    { name: "Task Scheduler", difficulty: "Medium" },
    { name: "Merge k Sorted Lists", difficulty: "Hard" },
    { name: "Find Median from Data Stream", difficulty: "Hard" },
  ],
  "union-find": [
    { name: "Number of Connected Components in an Undirected Graph", difficulty: "Medium" },
    { name: "Redundant Connection", difficulty: "Medium" },
    { name: "Accounts Merge", difficulty: "Medium" },
    { name: "Most Stones Removed with Same Row or Column", difficulty: "Medium" },
  ],
  dijkstra: [
    { name: "Network Delay Time", difficulty: "Medium" },
    { name: "Path with Minimum Effort", difficulty: "Medium" },
    { name: "Cheapest Flights Within K Stops", difficulty: "Medium" },
    { name: "Swim in Rising Water", difficulty: "Hard" },
  ],
};

/** Stable id for a problem, used as the localStorage key. */
export function problemId(patternId: string, name: string): string {
  return `${patternId}::${name}`;
}

export function countByDifficulty(problems: Problem[]) {
  return {
    Easy: problems.filter((p) => p.difficulty === "Easy").length,
    Medium: problems.filter((p) => p.difficulty === "Medium").length,
    Hard: problems.filter((p) => p.difficulty === "Hard").length,
  };
}
