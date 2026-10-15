import { useId } from "react";
import {
  PLAYGROUND_EXAMPLES,
  describePlaygroundInput,
} from "../../data/playgroundExamples";

export default function ExampleSelector({
  id,
  selected,
  onSelect,
}: {
  id: string;
  selected: number;
  onSelect: (index: number) => void;
}) {
  const control = useId();
  const examples = PLAYGROUND_EXAMPLES[id];
  if (!examples) return null;
  const example = examples[selected] ?? examples[0];
  return (
    <section className="playground-example" aria-label="Playground examples">
      <div className="playground-example-heading">
        <label htmlFor={control}>Choose an example</label>
        <span>
          {selected + 1} of {examples.length}
        </span>
      </div>
      <select
        id={control}
        aria-label="Playground example"
        value={selected}
        onChange={(event) => onSelect(Number(event.target.value))}
      >
        {examples.map((item, index) => (
          <option key={item.id} value={index}>
            {index + 1}. {item.label}
          </option>
        ))}
      </select>
      <p className="playground-example-note">{example.note}</p>
      <p className="playground-example-input">
        {describePlaygroundInput(example.input)}
      </p>
    </section>
  );
}
