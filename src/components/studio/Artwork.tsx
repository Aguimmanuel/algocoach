/** Original, scalable course illustrations; no remote assets. */
export default function Artwork({ kind = 0 }: { kind?: number }) {
  const stroke = "#253d33";
  return (
    <svg
      viewBox="0 0 360 220"
      fill="none"
      aria-hidden="true"
      className="course-art"
    >
      <defs>
        <pattern
          id={`dots-${kind}`}
          width="20"
          height="20"
          patternUnits="userSpaceOnUse"
        >
          <circle cx="2" cy="2" r="1" fill={stroke} opacity=".12" />
        </pattern>
      </defs>
      <rect width="360" height="220" fill={`url(#dots-${kind})`} />
      {kind === 0 ? (
        <>
          <path
            d="M72 60L180 24L288 60L180 96Z"
            fill="#f8fff3"
            stroke={stroke}
            strokeWidth="2"
          />
          <path
            d="M72 60V158L180 196V96Z"
            fill="#a9d79b"
            stroke={stroke}
            strokeWidth="2"
          />
          <path
            d="M180 96L288 60V158L180 196Z"
            fill="#d7ebc4"
            stroke={stroke}
            strokeWidth="2"
          />
          {[0, 1, 2].map((i) => (
            <g key={i}>
              <path
                d={`M${108 + i * 36} ${72 + i * 12}V${170 + i * 12}`}
                stroke={stroke}
                opacity=".5"
              />
              <path
                d={`M72 ${92 + i * 32}L180 ${128 + i * 32}L288 ${92 + i * 32}`}
                stroke={stroke}
                opacity=".5"
              />
            </g>
          ))}
          <path
            d="M123 43L232 80M159 31L268 68M108 72L216 36M144 84L252 48"
            stroke={stroke}
            opacity=".5"
          />
          <rect
            x="221"
            y="109"
            width="51"
            height="49"
            rx="7"
            fill="#f3cd69"
            stroke={stroke}
            strokeWidth="2"
            transform="rotate(-18 221 109)"
          />
          <path
            d="M240 125L249 121L245 145"
            stroke={stroke}
            strokeWidth="3"
            strokeLinecap="round"
          />
          <circle cx="73" cy="46" r="5" fill="#3a7253" />
          <path d="M299 174H311M305 168V180" stroke={stroke} strokeWidth="2" />
        </>
      ) : kind === 1 ? (
        <>
          <path
            d="M80 165L130 116L190 146L267 62"
            stroke={stroke}
            strokeWidth="3"
          />
          <path
            d="M80 165V63H267"
            stroke={stroke}
            strokeWidth="2"
            strokeDasharray="5 7"
            opacity=".4"
          />
          {[
            [80, 165],
            [130, 116],
            [190, 146],
            [267, 62],
          ].map(([x, y], i) => (
            <g key={i}>
              <circle
                cx={x}
                cy={y}
                r="23"
                fill={["#f8f4e9", "#b3a8e8", "#f8f4e9", "#8f80ca"][i]}
                stroke={stroke}
                strokeWidth="2"
              />
              <text
                x={x}
                y={y + 6}
                fill={stroke}
                textAnchor="middle"
                fontSize="17"
                fontWeight="700"
              >
                {i + 1}
              </text>
            </g>
          ))}
          <path
            d="M129 71L153 47L177 71L153 95Z"
            fill="#dfd6f6"
            stroke={stroke}
            strokeWidth="2"
          />
          <path d="M258 146H290M274 130V162" stroke={stroke} strokeWidth="2" />
        </>
      ) : (
        <>
          <path
            d="M180 48L102 108L78 173M180 48L258 108L282 173M102 108L153 173M258 108L211 173"
            stroke={stroke}
            strokeWidth="2.5"
          />
          {[
            [180, 48],
            [102, 108],
            [258, 108],
            [78, 173],
            [153, 173],
            [211, 173],
            [282, 173],
          ].map(([x, y], i) => (
            <g key={i}>
              <circle
                cx={x}
                cy={y}
                r={i === 0 ? 24 : 19}
                fill={i === 0 ? "#eeae54" : i < 3 ? "#f6cf88" : "#fff7e8"}
                stroke={stroke}
                strokeWidth="2"
              />
              <circle cx={x} cy={y} r="4" fill={stroke} />
            </g>
          ))}
          <path
            d="M72 44H84M78 38V50M282 40L290 48L282 56L274 48Z"
            stroke={stroke}
            strokeWidth="2"
          />
        </>
      )}
    </svg>
  );
}
