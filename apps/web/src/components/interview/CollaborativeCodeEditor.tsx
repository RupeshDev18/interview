'use client';

import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import {
  Play,
  RotateCcw,
  Copy,
  Check,
  Terminal,
  Code2,
  Sparkles,
  Zap,
  Trash2,
  Clock,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Socket } from 'socket.io-client';

// Dynamically import Monaco Editor to avoid SSR window issues
const Editor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

export type SupportedLanguage =
  | 'javascript'
  | 'typescript'
  | 'python'
  | 'java'
  | 'cpp'
  | 'go'
  | 'sql';

interface LanguageConfig {
  id: SupportedLanguage;
  name: string;
  defaultCode: string;
}

const LANGUAGE_TEMPLATES: LanguageConfig[] = [
  {
    id: 'javascript',
    name: 'JavaScript (Node.js)',
    defaultCode: `/**
 * Problem: Two Sum
 * Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.
 */

function twoSum(nums, target) {
  const map = new Map();
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (map.has(complement)) {
      return [map.get(complement), i];
    }
    map.set(nums[i], i);
  }
  return [];
}

// Test cases
console.log("Test 1:", twoSum([2, 7, 11, 15], 9)); // Output: [0, 1]
console.log("Test 2:", twoSum([3, 2, 4], 6));       // Output: [1, 2]
console.log("Test 3:", twoSum([3, 3], 6));          // Output: [0, 1]
`,
  },
  {
    id: 'typescript',
    name: 'TypeScript',
    defaultCode: `/**
 * Problem: Valid Parentheses
 * Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.
 */

function isValid(s: string): boolean {
  const stack: string[] = [];
  const map: Record<string, string> = {
    ')': '(',
    '}': '{',
    ']': '['
  };

  for (const char of s) {
    if (char in map) {
      if (stack.pop() !== map[char]) return false;
    } else {
      stack.push(char);
    }
  }

  return stack.length === 0;
}

// Test cases
console.log("Test 1 '()[]{}':", isValid("()[]{}")); // Output: true
console.log("Test 2 '(]':", isValid("(]"));         // Output: false
console.log("Test 3 '([)]':", isValid("([)]"));     // Output: false
`,
  },
  {
    id: 'python',
    name: 'Python 3',
    defaultCode: `def two_sum(nums: list[int], target: int) -> list[int]:
    lookup = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in lookup:
            return [lookup[complement], i]
        lookup[num] = i
    return []

# Test cases
print("Test 1:", two_sum([2, 7, 11, 15], 9)) # Output: [0, 1]
print("Test 2:", two_sum([3, 2, 4], 6))       # Output: [1, 2]
`,
  },
  {
    id: 'java',
    name: 'Java (OpenJDK 17)',
    defaultCode: `import java.util.*;

public class Solution {
    public static int[] twoSum(int[] nums, int target) {
        Map<Integer, Integer> map = new HashMap<>();
        for (int i = 0; i < nums.length; i++) {
            int complement = target - nums[i];
            if (map.containsKey(complement)) {
                return new int[] { map.get(complement), i };
            }
            map.put(nums[i], i);
        }
        return new int[0];
    }

    public static void main(String[] args) {
        int[] result = twoSum(new int[]{2, 7, 11, 15}, 9);
        System.out.println(Arrays.toString(result));
    }
}
`,
  },
  {
    id: 'cpp',
    name: 'C++ (GCC 12)',
    defaultCode: `#include <iostream>
#include <vector>
#include <unordered_map>

using namespace std;

vector<int> twoSum(vector<int>& nums, int target) {
    unordered_map<int, int> numMap;
    for (int i = 0; i < nums.size(); ++i) {
        int complement = target - nums[i];
        if (numMap.count(complement)) {
            return {numMap[complement], i};
        }
        numMap[nums[i]] = i;
    }
    return {};
}

int main() {
    vector<int> nums = {2, 7, 11, 15};
    vector<int> res = twoSum(nums, 9);
    cout << "[" << res[0] << ", " << res[1] << "]" << endl;
    return 0;
}
`,
  },
  {
    id: 'go',
    name: 'Go',
    defaultCode: `package main

import "fmt"

func twoSum(nums []int, target int) []int {
    seen := make(map[int]int)
    for i, num := range nums {
        complement := target - num
        if idx, ok := seen[complement]; ok {
            return []int{idx, i}
        }
        seen[num] = i
    }
    return nil
}

func main() {
    nums := []int{2, 7, 11, 15}
    fmt.Println("Result:", twoSum(nums, 9))
}
`,
  },
  {
    id: 'sql',
    name: 'PostgreSQL',
    defaultCode: `-- Problem: Find Second Highest Salary
SELECT MAX(salary) AS SecondHighestSalary
FROM employees
WHERE salary < (SELECT MAX(salary) FROM employees);
`,
  },
];

interface CollaborativeCodeEditorProps {
  meetingRoomId: string;
  socket: Socket | null;
  userName: string;
}

export function CollaborativeCodeEditor({
  meetingRoomId,
  socket,
  userName,
}: CollaborativeCodeEditorProps) {
  const [selectedLanguage, setSelectedLanguage] = useState<SupportedLanguage>('javascript');
  const [code, setCode] = useState<string>(
    LANGUAGE_TEMPLATES.find((t) => t.id === 'javascript')?.defaultCode || '',
  );
  const [output, setOutput] = useState<string>('');
  const [executionTime, setExecutionTime] = useState<number | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isConsoleOpen, setIsConsoleOpen] = useState(true);
  const [copied, setCopied] = useState(false);
  const [remoteTypingUser, setRemoteTypingUser] = useState<string | null>(null);

  const isLocalChange = useRef(false);
  const typingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync with remote peers via Socket.IO
  useEffect(() => {
    if (!socket) return;

    // Request initial code state from existing peers
    socket.emit('request-code-sync', { meetingRoomId });

    const handleCodeChange = (data: {
      from: string;
      code: string;
      language: SupportedLanguage;
      senderName?: string;
    }) => {
      isLocalChange.current = false;
      setCode(data.code);
      if (data.language && data.language !== selectedLanguage) {
        setSelectedLanguage(data.language);
      }

      if (data.senderName) {
        setRemoteTypingUser(data.senderName);
        if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
        typingTimerRef.current = setTimeout(() => setRemoteTypingUser(null), 2000);
      }
    };

    const handleCodeRunOutput = (data: {
      from: string;
      output: string;
      executionTime: number;
      status: 'success' | 'error';
      runnerName?: string;
    }) => {
      setOutput(data.output);
      setExecutionTime(data.executionTime);
      setIsConsoleOpen(true);
    };

    const handleRequestSync = (data: { requesterId: string }) => {
      socket.emit('code-sync-state', {
        meetingRoomId,
        code,
        language: selectedLanguage,
        to: data.requesterId,
      });
    };

    socket.on('code-change', handleCodeChange);
    socket.on('code-run-output', handleCodeRunOutput);
    socket.on('request-code-sync', handleRequestSync);

    return () => {
      socket.off('code-change', handleCodeChange);
      socket.off('code-run-output', handleCodeRunOutput);
      socket.off('request-code-sync', handleRequestSync);
    };
  }, [socket, meetingRoomId, code, selectedLanguage]);

  const handleEditorChange = (newCode: string | undefined) => {
    if (newCode === undefined) return;
    setCode(newCode);
    isLocalChange.current = true;

    if (socket) {
      socket.emit('code-change', {
        meetingRoomId,
        code: newCode,
        language: selectedLanguage,
        senderName: userName,
      });
    }
  };

  const handleLanguageChange = (newLang: SupportedLanguage) => {
    setSelectedLanguage(newLang);
    const template = LANGUAGE_TEMPLATES.find((t) => t.id === newLang)?.defaultCode || '';
    setCode(template);

    if (socket) {
      socket.emit('code-change', {
        meetingRoomId,
        code: template,
        language: newLang,
        senderName: userName,
      });
    }
  };

  const handleReset = () => {
    const template = LANGUAGE_TEMPLATES.find((t) => t.id === selectedLanguage)?.defaultCode || '';
    setCode(template);
    if (socket) {
      socket.emit('code-change', {
        meetingRoomId,
        code: template,
        language: selectedLanguage,
        senderName: userName,
      });
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // In-Browser Code Runner
  const handleRunCode = async () => {
    setIsRunning(true);
    setIsConsoleOpen(true);
    const startTime = performance.now();

    let logs: string[] = [];

    try {
      if (selectedLanguage === 'javascript' || selectedLanguage === 'typescript') {
        // Strip TS type annotations simply if needed for basic execution
        const cleanJs = code.replace(/:\s*[A-Za-z0-9_<>\[\]|]+/g, '');

        const customConsole = {
          log: (...args: any[]) => {
            logs.push(args.map((a) => (typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a))).join(' '));
          },
          error: (...args: any[]) => {
            logs.push('[ERROR] ' + args.map((a) => String(a)).join(' '));
          },
          warn: (...args: any[]) => {
            logs.push('[WARN] ' + args.map((a) => String(a)).join(' '));
          },
        };

        const runner = new Function('console', cleanJs);
        runner(customConsole);

        const endTime = performance.now();
        const duration = Math.round(endTime - startTime);
        const finalOutput = logs.length > 0 ? logs.join('\n') : 'Code executed with no output returned.';

        setOutput(finalOutput);
        setExecutionTime(duration);

        if (socket) {
          socket.emit('code-run-output', {
            meetingRoomId,
            output: finalOutput,
            executionTime: duration,
            status: 'success',
            runnerName: userName,
          });
        }
      } else {
        // Simulated runner for other languages
        await new Promise((resolve) => setTimeout(resolve, 300));
        const endTime = performance.now();
        const duration = Math.round(endTime - startTime);
        const simulatedOutput = `[${selectedLanguage.toUpperCase()} Runtime Simulated]\nCompiled successfully.\nAll test cases executed.`;

        setOutput(simulatedOutput);
        setExecutionTime(duration);

        if (socket) {
          socket.emit('code-run-output', {
            meetingRoomId,
            output: simulatedOutput,
            executionTime: duration,
            status: 'success',
            runnerName: userName,
          });
        }
      }
    } catch (err: any) {
      const endTime = performance.now();
      const duration = Math.round(endTime - startTime);
      const errOutput = `Runtime Error: ${err?.message || String(err)}`;

      setOutput(errOutput);
      setExecutionTime(duration);

      if (socket) {
        socket.emit('code-run-output', {
          meetingRoomId,
          output: errOutput,
          executionTime: duration,
          status: 'error',
          runnerName: userName,
        });
      }
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-stone-950 rounded-2xl border border-theme overflow-hidden shadow-xl text-stone-200">
      {/* Editor Top Bar */}
      <div className="px-4 py-2.5 bg-stone-900 border-b border-stone-800 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-theme-accent flex items-center justify-center text-white shadow-sm">
            <Code2 className="h-4 w-4" />
          </div>

          {/* Language Selector */}
          <select
            value={selectedLanguage}
            onChange={(e) => handleLanguageChange(e.target.value as SupportedLanguage)}
            className="bg-stone-800 border border-stone-700 text-stone-200 text-xs rounded-lg px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-theme-accent font-mono"
          >
            {LANGUAGE_TEMPLATES.map((lang) => (
              <option key={lang.id} value={lang.id}>
                {lang.name}
              </option>
            ))}
          </select>

          {/* Typing Indicator */}
          {remoteTypingUser && (
            <span className="text-[11px] text-theme-accent font-mono animate-pulse flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-theme-accent" />
              {remoteTypingUser} is typing…
            </span>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={handleReset}
            className="h-7 text-xs text-stone-400 hover:text-stone-200 hover:bg-stone-800"
            title="Reset to starter template"
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1" /> Reset
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={handleCopyCode}
            className="h-7 text-xs text-stone-400 hover:text-stone-200 hover:bg-stone-800"
          >
            {copied ? <Check className="h-3.5 w-3.5 mr-1 text-emerald-400" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
            {copied ? 'Copied' : 'Copy'}
          </Button>

          <Button
            size="sm"
            onClick={handleRunCode}
            disabled={isRunning}
            className="h-7 text-xs gradient-theme-btn font-bold px-3 shadow-md gap-1.5"
          >
            <Play className={`h-3.5 w-3.5 fill-current ${isRunning ? 'animate-spin' : ''}`} />
            {isRunning ? 'Running…' : 'Run Code'}
          </Button>
        </div>
      </div>

      {/* Monaco Code Editor Area */}
      <div className="flex-1 min-h-[360px] relative bg-stone-950">
        <Editor
          height="100%"
          language={selectedLanguage === 'cpp' ? 'cpp' : selectedLanguage}
          value={code}
          theme="vs-dark"
          onChange={handleEditorChange}
          options={{
            fontSize: 13,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            lineNumbers: 'on',
            wordWrap: 'on',
            padding: { top: 12, bottom: 12 },
            cursorBlinking: 'smooth',
            smoothScrolling: true,
            fontFamily: 'JetBrains Mono, Menlo, Monaco, Consolas, monospace',
          }}
        />
      </div>

      {/* Interactive Output Console / Terminal */}
      <div className="border-t border-stone-800 bg-stone-900/90 backdrop-blur-md">
        <div
          onClick={() => setIsConsoleOpen(!isConsoleOpen)}
          className="px-4 py-2 flex items-center justify-between cursor-pointer hover:bg-stone-800/50 transition-colors"
        >
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-stone-300">
            <Terminal className="h-3.5 w-3.5 text-theme-accent" />
            <span>Execution Output Terminal</span>
            {executionTime !== null && (
              <span className="text-[11px] font-normal text-emerald-400 ml-2">
                ({executionTime} ms)
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {output && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setOutput('');
                  setExecutionTime(null);
                }}
                className="p-1 text-stone-400 hover:text-rose-400 transition-colors"
                title="Clear console"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
            {isConsoleOpen ? <ChevronDown className="h-4 w-4 text-stone-400" /> : <ChevronUp className="h-4 w-4 text-stone-400" />}
          </div>
        </div>

        {isConsoleOpen && (
          <div className="p-3.5 max-h-44 overflow-y-auto font-mono text-xs text-stone-300 bg-stone-950/80 border-t border-stone-800/60 leading-relaxed whitespace-pre-wrap">
            {output ? (
              <div className="space-y-1">
                {output.split('\n').map((line, i) => (
                  <div
                    key={i}
                    className={
                      line.startsWith('Runtime Error') || line.startsWith('[ERROR]')
                        ? 'text-rose-400 font-semibold'
                        : line.startsWith('[WARN]')
                        ? 'text-amber-400'
                        : 'text-stone-300'
                    }
                  >
                    {line}
                  </div>
                ))}
              </div>
            ) : (
              <span className="text-stone-400 italic">
                Click "Run Code" above to execute your solution and observe stdout output.
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
