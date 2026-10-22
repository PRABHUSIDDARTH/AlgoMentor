import type { Lesson } from '../types'

const lesson: Lesson = {
  id: 'polymorphism',
  title: 'Polymorphism: overloading and overriding',
  minutes: 9,
  body: `## One call, many behaviours

**Polymorphism** means "many forms": the same call does the right thing for different kinds of objects. You write \`shape.area()\` once and it computes a circle's area for a circle and a rectangle's for a rectangle. The caller doesn't need an \`if\` for every shape, and adding a new shape doesn't touch the caller.

There are two kinds, and interviewers like to ask for both.

## Compile-time polymorphism: overloading

**Overloading** means several methods share a name but take different parameters: \`print(int)\`, \`print(String)\`, \`print(int, int)\`. The compiler picks which one to call from the argument types it sees, before the program runs. That is why it is also called *static* polymorphism.

Overloads are a convenience for callers. Keep them consistent: every \`print\` should print. Changing only the return type is not an overload in Java or C++, and Python has no overloading at all; it uses default and keyword arguments instead.

Operator overloading is the same idea applied to operators: C++ and Python let a \`Money\` class define \`+\`, so \`price + tax\` reads naturally.

## Run-time polymorphism: overriding

**Overriding** is where object-oriented design gets its power. A subclass replaces a method it inherited, and when you call that method through a reference of the parent type, the program decides at run time which version to run based on the actual object. This is **dynamic dispatch**.

\`\`\`
Shape s = new Circle(2);
s.area();   // runs Circle.area, even though s is declared as Shape
\`\`\`

Under the hood, languages like C++ and Java keep a table of method pointers per class (a *vtable*). Each object points at its class's table, so a call looks up the right function in constant time. In C++ only methods marked \`virtual\` are dispatched this way; in Java every non-static, non-final, non-private method is.

## Replacing conditionals with polymorphism

A long \`switch\` on a type field (\`if kind == "circle" ... else if kind == "square" ...\`) is a sign that polymorphism is missing. Every time you add a kind, you must find and update every switch. Move each branch into a class with a shared method, and adding a kind becomes adding one class. This is the *open/closed principle* in action: open to extension, closed to modification.

## Duck typing

Python and other dynamic languages take this further with **duck typing**: if an object has an \`area()\` method, you can call it, whatever its class. No shared parent is needed. It is flexible, but the contract is implicit, which is why type hints and \`Protocol\` classes exist to make it explicit again.

## Common pitfalls

- **Calling overridable methods from a constructor.** The subclass's override may run before the subclass's fields are set.
- **Forgetting a virtual destructor in C++.** Deleting a derived object through a base pointer without one leaks the derived part.
- **Overloading on related types** (\`f(Object)\` and \`f(String)\`): which one runs depends on the declared type, not the actual one, and surprises readers.

Remember the one-line summary for interviews: overloading is chosen by the compiler from the parameters; overriding is chosen at run time from the object.`,
  code: {
    java: `import java.util.List;

public abstract class Shape {
    public abstract double area();

    public static double totalArea(List<Shape> shapes) {
        double total = 0;
        for (Shape s : shapes) total += s.area(); // dynamic dispatch
        return total;
    }

    // Overloading: same name, different parameters, chosen at compile time.
    public static String label(double value) {
        return String.format("%.2f", value);
    }

    public static String label(double value, String unit) {
        return label(value) + " " + unit;
    }
}

class Circle extends Shape {
    private final double r;

    Circle(double r) {
        this.r = r;
    }

    @Override
    public double area() {
        return Math.PI * r * r;
    }
}

class Rect extends Shape {
    private final double w;
    private final double h;

    Rect(double w, double h) {
        this.w = w;
        this.h = h;
    }

    @Override
    public double area() {
        return w * h;
    }
}`,
    python: `from math import pi
from typing import Protocol


class Shape(Protocol):
    def area(self) -> float: ...


class Circle:
    def __init__(self, r: float) -> None:
        self.r = r

    def area(self) -> float:
        return pi * self.r ** 2


class Rect:
    def __init__(self, w: float, h: float) -> None:
        self.w, self.h = w, h

    def area(self) -> float:
        return self.w * self.h


def total_area(shapes: list[Shape]) -> float:
    return sum(s.area() for s in shapes)  # duck typing: anything with area()


def label(value: float, unit: str = "") -> str:  # defaults instead of overloads
    return f"{value:.2f} {unit}".strip()`,
    cpp: `#include <memory>
#include <numbers>
#include <string>
#include <vector>

class Shape {
public:
    virtual ~Shape() = default;  // needed when deleting through a base pointer
    virtual double area() const = 0;
};

class Circle : public Shape {
public:
    explicit Circle(double r) : r_(r) {}
    double area() const override { return std::numbers::pi * r_ * r_; }

private:
    double r_;
};

class Rect : public Shape {
public:
    Rect(double w, double h) : w_(w), h_(h) {}
    double area() const override { return w_ * h_; }

private:
    double w_, h_;
};

double totalArea(const std::vector<std::unique_ptr<Shape>>& shapes) {
    double total = 0;
    for (const auto& s : shapes) total += s->area();
    return total;
}

// Overloading: chosen by the compiler from the argument types.
std::string label(double value) { return std::to_string(value); }
std::string label(double value, const std::string& unit) { return label(value) + " " + unit; }`,
  },
  quiz: [
    { id: 'po-1', prompt: 'Method overloading is resolved:', options: ['At run time, from the actual object', 'At compile time, from the argument types', 'By the garbage collector', 'Only in Python'], answer: 1, why: 'The compiler picks the overload from the parameter list it sees, so it is static polymorphism.' },
    { id: 'po-2', prompt: 'Shape s = new Circle(2); s.area(); Which area() runs?', options: ['Shape.area', 'Circle.area', 'Both, in order', 'It does not compile'], answer: 1, why: 'Overridden methods are dispatched on the actual object at run time.' },
    { id: 'po-3', prompt: 'A long switch on an object\'s "kind" field is usually a sign that:', options: ['The code is well optimised', 'Polymorphism should replace the conditional', 'The class needs more static methods', 'Inheritance must be removed'], answer: 1, why: 'Moving each branch into a subclass method means adding a kind no longer requires editing every switch.' },
    { id: 'po-4', prompt: 'In C++, why should a base class with virtual methods have a virtual destructor?', options: ['To make objects smaller', 'So deleting a derived object through a base pointer runs the derived destructor', 'Because constructors cannot be virtual', 'It is required for overloading'], answer: 1, why: 'Without it, delete on a base pointer only destroys the base part: undefined behaviour and leaks.' },
    { id: 'po-5', prompt: 'Which is NOT a valid overload in Java?', options: ['f(int) and f(String)', 'f(int) and f(int, int)', 'int f(int) and String f(int)', 'f(double) and f(int)'], answer: 2, why: 'Overloads must differ in parameters; a different return type alone is a compile error.' },
  ],
  interview: [
    { q: 'What is the difference between overloading and overriding?', a: 'Overloading: same name, different parameters in one class, chosen by the compiler (static). Overriding: a subclass replaces an inherited method with the same signature, chosen at run time from the actual object (dynamic dispatch).' },
    { q: 'How does dynamic dispatch work?', a: 'Each class with overridable methods has a table of function pointers (vtable). Each object holds a pointer to its class\'s table, and a virtual call looks up the method in that table, so the actual object\'s version runs in constant time.' },
    { q: 'What is duck typing?', a: 'In dynamic languages, an object is usable wherever its methods are present, regardless of its class: "if it quacks like a duck". Python formalises it with Protocol types for static checking.' },
  ],
}

export default lesson
