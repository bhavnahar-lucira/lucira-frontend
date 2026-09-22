const rawStatus = "ready to ship";

const stages = [
  "Order Confirmed",
  "Processing",
  "Manufacturing",
  "Quality Control",
  "Certification",
  "Dispatch",
  "In Transit",
  "Delivered"
];

const normalizedStatus = rawStatus.replace(/[^a-z0-9]/g, '');

let currentStageIndex = 0;
if (normalizedStatus.includes('readytoship')) {
  currentStageIndex = 5;
} else if (normalizedStatus.includes('process')) {
  currentStageIndex = 1;
}

console.log(`For rawStatus "${rawStatus}", normalizedStatus is "${normalizedStatus}", currentStageIndex is ${currentStageIndex}, stage is ${stages[currentStageIndex]}`);
