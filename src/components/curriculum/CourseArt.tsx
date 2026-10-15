import Artwork from "../studio/Artwork";
export default function CourseArt({ id }: { id: string }) {
  if (id !== "pixel-pusher")
    return (
      <Artwork
        kind={
          id === "foundations" || id === "arrays"
            ? 0
            : id === "structures" || id === "recursion-dp"
              ? 1
              : 2
        }
      />
    );
  return (
    <svg
      className="pixel-course-art"
      viewBox="0 0 400 260"
      fill="none"
      aria-hidden="true"
    >
      <rect
        x="74"
        y="33"
        width="228"
        height="154"
        rx="12"
        fill="#fffaf2"
        stroke="#354936"
        strokeWidth="2"
        transform="rotate(-8 74 33)"
      />
      <g transform="translate(105 65) rotate(-8)">
        {Array.from({ length: 8 }, (_, y) =>
          Array.from({ length: 11 }, (_, x) => {
            const color =
              y < 3
                ? "#b9deda"
                : y < 6 && x > 2 && x < 9
                  ? "#80928e"
                  : y >= 6
                    ? "#9ab98a"
                    : "#cee4dc";
            return (
              <rect
                key={`${x}-${y}`}
                x={x * 15}
                y={y * 15}
                width="14"
                height="14"
                rx="1"
                fill={x > 7 && y < 3 ? "#efcf84" : color}
              />
            );
          }),
        )}
      </g>
      <rect
        x="235"
        y="118"
        width="91"
        height="85"
        rx="11"
        fill="#e8dff4"
        stroke="#615379"
        strokeWidth="1.5"
        transform="rotate(9 235 118)"
      />
      <text
        x="264"
        y="157"
        fontFamily="monospace"
        fontSize="19"
        fill="#615379"
        transform="rotate(9 264 157)"
      >
        f(x)
      </text>
      <path
        d="M182 190Q201 221 235 203"
        stroke="#5b7653"
        strokeWidth="2"
        strokeDasharray="4 5"
      />
      <circle cx="63" cy="177" r="9" fill="#cfaf6f" />
      <path d="M342 61V78M333 69H351" stroke="#6c8c73" strokeWidth="2" />
    </svg>
  );
}
