const currentAvailableFilters = {
  "Ring Size": [
    { label: "12", value: "12", input: { "v.m.custom.ring_size": ["12"] } },
    { label: "14", value: "14", input: { "v.m.custom.ring_size": ["14"] } }
  ]
};

const currentSearchParams = new URLSearchParams("filter.v.m.custom.ring_size=12&filter.v.m.custom.ring_size=14");
const filters = {};

currentSearchParams.forEach((value, key) => {
    let actualGroupKey = "Ring Size"; // Simplified for test
    if (actualGroupKey) {
        if (!filters[actualGroupKey]) filters[actualGroupKey] = [];
        
        let optInput = null;
        if (currentAvailableFilters && currentAvailableFilters[actualGroupKey]) {
        const foundOpt = currentAvailableFilters[actualGroupKey].find(o => (o.value === value || o.label === value));
        if (foundOpt && foundOpt.input) {
            optInput = foundOpt.input;
        }
        }

        if (optInput) {
        filters[actualGroupKey].push({ label: value, input: optInput });
        } else {
        filters[actualGroupKey].push({ label: value });
        }
    }
});

console.log(JSON.stringify(filters, null, 2));
