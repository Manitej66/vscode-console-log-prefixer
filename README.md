# Console Log Prefixer

Automatically add prefixes to console.log statements in JavaScript and TypeScript files based on special comments.

## Features

- Automatically adds prefixes to console.log statements that have a special comment above them
- Automatically removes prefixes when comments are removed
- Makes filtering logs in browser console easy
- Works with JavaScript, TypeScript, JSX, and TSX files

## Usage

Add a special comment above any console.log statement you want to prefix:

```javascript
// mylog:
console.log("This will get a prefix");
```
