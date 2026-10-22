import type { Lesson } from '../types'

const lesson: Lesson = {
  id: 'oop-interviews',
  title: 'OOP in interviews: design a parking lot',
  minutes: 12,
  body: `## What the interviewer is looking for

"Design a parking lot" (or a library, an elevator, a vending machine) is a **low-level design** question. Nobody expects a finished system in 45 minutes. The interviewer wants to see you turn a vague problem into a clean set of classes, explain your choices, and adapt when requirements change. A steady process matters more than clever code.

## Step 1: clarify the requirements (5 minutes)

Ask before you design. For a parking lot:

- How many floors? Several entry and exit gates?
- Which vehicle types: motorcycles, cars, trucks? Which spot sizes, and can a car use a large spot?
- How is the fee calculated: per hour, flat daily rate, different by vehicle?
- Do we need to show free spots per floor? Handle payment, or just compute it?

Write the agreed scope down in a few lines. It shows structure and gives you something to point back to when the interviewer adds a twist.

## Step 2: find the core objects

Underline the nouns: lot, floor, spot, vehicle, ticket, gate, payment, pricing. Drop what is out of scope and keep the rest as candidate classes:

- \`ParkingLot\` (the entry point) has \`Floors\`; each floor has \`Spots\`.
- \`Spot\` has a size and maybe holds a \`Vehicle\`.
- \`Vehicle\` has a type that decides which spot sizes fit.
- \`Ticket\` records the vehicle, the spot and the entry time.
- \`PricingStrategy\` computes the fee from a ticket and an exit time.

Sketch these as a quick class diagram with relationships and multiplicities.

## Step 3: define behaviour and the main flows

Walk through the two core use cases and let them decide the methods:

- **Park:** \`ParkingLot.park(vehicle)\` finds a free spot that fits (nearest floor first), marks it occupied and returns a \`Ticket\`.
- **Leave:** \`ParkingLot.leave(ticket, exitTime)\` frees the spot and returns the fee from the pricing strategy.

Keep each rule where its data lives: a spot knows whether it is free and whether a vehicle fits; the lot coordinates; pricing is a strategy so it can change without touching parking logic.

## Step 4: apply the principles out loud

Say why the design looks the way it does. **Encapsulation**: spots change state only through \`assign\` and \`release\`. **Strategy**: hourly or daily pricing is swappable. **Open/closed**: a new vehicle type or pricing rule is a new class. **Single responsibility**: the lot doesn't format receipts.

## Step 5: handle edge cases and extensions

Interviewers will probe. Have answers ready:

- **Lot full:** \`park\` returns empty or throws a clear exception; don't return a null ticket silently.
- **Two cars, one spot, at the same time:** spot assignment must be atomic. Synchronise the find-and-assign step or use a lock per floor.
- **Lost ticket:** charge a maximum daily fee, found by vehicle registration.
- **New requirement, electric charging spots:** add a spot feature or subtype and a fitting rule; existing code barely changes, which is the payoff of the earlier design.

## Step 6: write the core code

Code the central classes and the two flows, not every getter. Clear names and small methods beat completeness. If time remains, add a test-like walkthrough: park two cars, leave one, check the fee.

The same six steps work for a library system (members, books, copies, loans, fines), an elevator (requests, scheduling strategy, cars) or a vending machine (states, inventory, payment). Practise one end to end, aloud, before your interview.`,
  code: {
    java: `import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

public class ParkingLot {
    enum Size { SMALL, MEDIUM, LARGE }

    enum VehicleType {
        MOTORCYCLE(Size.SMALL), CAR(Size.MEDIUM), TRUCK(Size.LARGE);

        final Size needs;

        VehicleType(Size needs) {
            this.needs = needs;
        }
    }

    record Vehicle(String plate, VehicleType type) {
    }

    record Ticket(Vehicle vehicle, Spot spot, Instant entry) {
    }

    interface PricingStrategy {
        long feeCents(Ticket ticket, Instant exit);
    }

    static final class Spot {
        final String id;
        final Size size;
        private Vehicle parked;

        Spot(String id, Size size) {
            this.id = id;
            this.size = size;
        }

        boolean fits(Vehicle v) {
            return parked == null && size.ordinal() >= v.type().needs.ordinal();
        }

        void assign(Vehicle v) {
            if (!fits(v)) throw new IllegalStateException("spot " + id + " can't take " + v.plate());
            parked = v;
        }

        void release() {
            parked = null;
        }
    }

    private final List<Spot> spots = new ArrayList<>();
    private final PricingStrategy pricing;

    public ParkingLot(List<Spot> spots, PricingStrategy pricing) {
        this.spots.addAll(spots);
        this.pricing = pricing;
    }

    public synchronized Optional<Ticket> park(Vehicle v, Instant now) {
        for (Spot s : spots) {
            if (s.fits(v)) {
                s.assign(v);
                return Optional.of(new Ticket(v, s, now));
            }
        }
        return Optional.empty(); // lot full for this vehicle
    }

    public synchronized long leave(Ticket t, Instant exit) {
        t.spot().release();
        return pricing.feeCents(t, exit);
    }

    static long hourly(Ticket t, Instant exit) {
        long hours = Math.max(1, (Duration.between(t.entry(), exit).toMinutes() + 59) / 60);
        return hours * 200;
    }
}`,
    python: `from dataclasses import dataclass
from datetime import datetime
from enum import Enum
from math import ceil
from threading import Lock
from typing import Callable


class Size(Enum):
    SMALL = 1
    MEDIUM = 2
    LARGE = 3


NEEDS = {"motorcycle": Size.SMALL, "car": Size.MEDIUM, "truck": Size.LARGE}


@dataclass(frozen=True)
class Vehicle:
    plate: str
    kind: str


class Spot:
    def __init__(self, spot_id: str, size: Size) -> None:
        self.id, self.size = spot_id, size
        self._parked: Vehicle | None = None

    def fits(self, v: Vehicle) -> bool:
        return self._parked is None and self.size.value >= NEEDS[v.kind].value

    def assign(self, v: Vehicle) -> None:
        if not self.fits(v):
            raise ValueError(f"spot {self.id} can't take {v.plate}")
        self._parked = v

    def release(self) -> None:
        self._parked = None


@dataclass(frozen=True)
class Ticket:
    vehicle: Vehicle
    spot: Spot
    entry: datetime


Pricing = Callable[[Ticket, datetime], int]


def hourly(ticket: Ticket, exit_time: datetime) -> int:
    hours = max(1, ceil((exit_time - ticket.entry).total_seconds() / 3600))
    return hours * 200


class ParkingLot:
    def __init__(self, spots: list[Spot], pricing: Pricing) -> None:
        self._spots, self._pricing, self._lock = spots, pricing, Lock()

    def park(self, v: Vehicle, now: datetime) -> Ticket | None:
        with self._lock:  # find-and-assign must be atomic
            for s in self._spots:
                if s.fits(v):
                    s.assign(v)
                    return Ticket(v, s, now)
        return None

    def leave(self, ticket: Ticket, exit_time: datetime) -> int:
        with self._lock:
            ticket.spot.release()
        return self._pricing(ticket, exit_time)`,
    cpp: `#include <algorithm>
#include <chrono>
#include <functional>
#include <mutex>
#include <optional>
#include <stdexcept>
#include <string>
#include <vector>

enum class Size { Small = 1, Medium = 2, Large = 3 };

struct Vehicle {
    std::string plate;
    Size needs;
};

class Spot {
public:
    Spot(std::string id, Size size) : id_(std::move(id)), size_(size) {}
    bool fits(const Vehicle& v) const { return !parked_ && size_ >= v.needs; }
    void assign(const Vehicle& v) {
        if (!fits(v)) throw std::logic_error("spot " + id_ + " can't take " + v.plate);
        parked_ = v;
    }
    void release() { parked_.reset(); }

private:
    std::string id_;
    Size size_;
    std::optional<Vehicle> parked_;
};

using Clock = std::chrono::system_clock;

struct Ticket {
    Vehicle vehicle;
    Spot* spot;
    Clock::time_point entry;
};

class ParkingLot {
public:
    using Pricing = std::function<long long(const Ticket&, Clock::time_point)>;
    ParkingLot(std::vector<Spot> spots, Pricing pricing) : spots_(std::move(spots)), pricing_(std::move(pricing)) {}

    std::optional<Ticket> park(const Vehicle& v, Clock::time_point now) {
        std::lock_guard<std::mutex> guard(mutex_);  // find-and-assign must be atomic
        for (auto& s : spots_) {
            if (s.fits(v)) {
                s.assign(v);
                return Ticket{v, &s, now};
            }
        }
        return std::nullopt;
    }

    long long leave(const Ticket& t, Clock::time_point exit) {
        {
            std::lock_guard<std::mutex> guard(mutex_);
            t.spot->release();
        }
        return pricing_(t, exit);
    }

private:
    std::vector<Spot> spots_;
    Pricing pricing_;
    std::mutex mutex_;
};

long long hourly(const Ticket& t, Clock::time_point exit) {
    auto minutes = std::chrono::duration_cast<std::chrono::minutes>(exit - t.entry).count();
    return std::max<long long>(1, (minutes + 59) / 60) * 200;
}`,
  },
  quiz: [
    { id: 'oi-1', prompt: 'What should you do first in a low-level design interview?', options: ['Start writing the main class', 'Clarify requirements and agree the scope', 'Draw the database schema', 'Pick design patterns to use'], answer: 1, why: 'Scope decides the design; asking first also shows structure and avoids solving the wrong problem.' },
    { id: 'oi-2', prompt: 'Where should the "does this vehicle fit?" rule live in a parking lot design?', options: ['In the ParkingLot\'s main loop', 'In Spot (or a fitting rule it uses), next to the size data', 'In the Ticket class', 'In a static utility class'], answer: 1, why: 'Rules belong with the data they depend on, which keeps ParkingLot a coordinator.' },
    { id: 'oi-3', prompt: 'Why model pricing as a strategy?', options: ['Strategies are faster', 'Pricing rules change independently and can be swapped without touching parking logic', 'Java requires it', 'To avoid writing tests'], answer: 1, why: 'Hourly, daily or member pricing become separate classes chosen at run time (open/closed).' },
    { id: 'oi-4', prompt: 'Two cars try to take the last spot at the same moment. What must the design guarantee?', options: ['Both get tickets', 'Find-and-assign is atomic, so only one succeeds', 'The second car waits forever', 'Nothing, this cannot happen'], answer: 1, why: 'Without synchronisation two threads can both see the spot as free and both assign it.' },
    { id: 'oi-5', prompt: 'The interviewer adds electric charging spots. A good design lets you:', options: ['Rewrite ParkingLot', 'Add a spot feature or subtype and a fitting rule with little change elsewhere', 'Add a boolean to every class', 'Start the design again'], answer: 1, why: 'A design built on small, cohesive classes and strategies absorbs new requirements locally.' },
  ],
  interview: [
    { q: 'Walk me through how you approach a low-level design question.', a: 'Clarify requirements and scope; identify core objects from the nouns; define the main flows and the methods they need; apply principles such as encapsulation and strategy and say why; cover edge cases like concurrency and failures; then code the core classes.' },
    { q: 'How do you handle concurrency in the parking lot?', a: 'Make finding and assigning a spot atomic: a lock around the operation (or per floor for less contention), or a compare-and-set on the spot\'s state. Releasing a spot also goes through the same guard.' },
    { q: 'How would the design change for a library system?', a: 'Same process: Member, Book (title), Copy (physical item), Loan with due date, Fine via a strategy, and a Library coordinating borrow and return. Copies, not books, are borrowed, and limits live with Member.' },
  ],
}

export default lesson
