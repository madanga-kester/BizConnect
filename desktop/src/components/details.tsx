import { Icon } from "./icons";
import { Avatar, Modal, Pill } from "./ui";
import type { Business, Opportunity, Product } from "../data";

export function BusinessProfileView({ business, onClose, onFollow, followed, onMessage, onProduct }: { business: Business; onClose: () => void; onFollow: () => void; followed: boolean; onMessage: () => void; onProduct: () => void }) {
  return (
    <Modal title="Business profile" onClose={onClose} wide>
      <div className="detail-view">
        <div className="detail-hero" style={{ backgroundImage: `linear-gradient(90deg,${business.color}ee,${business.color}44),url('/${business.id === "urban" ? "urban-coffee" : business.id}.jpg')` }}>
          <Avatar initials={business.initials} color={business.color} size="lg"/>
        </div>
        <div className="detail-title">
          <div>
            <h2>{business.name}</h2>
            <p>{business.category} · <Icon name="location"/> {business.location}</p>
            <div className="rating"><Icon name="star"/> {business.rating} <span>({business.reviews} reviews)</span></div>
          </div>
          <div className="detail-actions">
            <button className="button button-soft" onClick={onFollow}>{followed ? "Following" : "Follow"}</button>
            <button className="button button-primary" onClick={onMessage}><Icon name="message"/> Message</button>
          </div>
        </div>
        <div className="detail-grid">
          <section>
            <h3>About</h3>
            <p>We help local customers and partners find dependable {business.category.toLowerCase()} services with a community-first approach.</p>
            <h3>Services & products</h3>
            <div className="detail-chips">
              <Pill>Custom consultations</Pill>
              <Pill tone="slate">Featured catalogue</Pill>
              <Pill tone="amber">Fast response</Pill>
            </div>
          </section>
          <aside className="detail-facts">
            <b>Hours</b>
            <span>Mon–Sat · 8:00–18:00</span>
            <b>Contact</b>
            <span>Available in Mabiz messages</span>
            <button className="button button-outline" onClick={onProduct}><Icon name="box"/> View products</button>
          </aside>
        </div>
        <div className="activity-strip">
          <b>Recent activity</b>
          <span>Posted a community update 32 min ago</span>
          <span>Responds to enquiries within a day</span>
        </div>
      </div>
    </Modal>
  );
}

export function ProductDetailView({ product, onClose, onMessage, onAction }: { product: Product; onClose: () => void; onMessage: () => void; onAction: () => void }) {
  return (
    <Modal title="Product & service detail" onClose={onClose} wide>
      <div className="product-detail">
        <div className="product-detail-art" style={{ background: product.accent }}>
          <span className={`art-shape art-${product.image}`}/>
        </div>
        <div>
          <Pill>{product.kind}</Pill>
          <h2>{product.name}</h2>
          <p className="muted">Sold by {product.business} · {product.category}</p>
          <strong className="detail-price">{product.price}</strong>
          <div className="rating"><Icon name="star"/> 4.8 <span>Trusted local seller</span></div>
          <p className="detail-copy">A carefully presented listing with clear pricing, responsive support and a simple next step for your enquiry.</p>
          <div className="detail-actions">
            <button className="button button-primary" onClick={onAction}>
              <Icon name={product.kind === "Product" ? "cart" : "calendar"}/>
              {product.kind === "Product" ? "Add to cart" : "Book service"}
            </button>
            <button className="button button-outline" onClick={onMessage}><Icon name="message"/> Send enquiry</button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

export function OpportunityDetailView({ item, onClose, onEnquire }: { item: Opportunity; onClose: () => void; onEnquire: () => void }) {
  return (
    <Modal title="Opportunity detail" onClose={onClose} wide>
      <div className="opportunity-detail">
        <div className="opportunity-detail-hero" style={{ backgroundImage: "url('/opportunity-handshake.jpg')" }}>
          <Pill>{item.category}</Pill>
        </div>
        <div className="opportunity-detail-body">
          <div>
            <h2>{item.title}</h2>
            <p>{item.description}</p>
            <div className="detail-chips">
              <Pill tone="slate"><Icon name="location"/> Nairobi & remote</Pill>
              <Pill tone="amber"><Icon name="calendar"/> Expires in 28 days</Pill>
            </div>
          </div>
          <aside className="budget-box">
            <span>Budget</span>
            <strong>{item.budget}</strong>
            <button className="button button-primary" onClick={onEnquire}>Start enquiry<Icon name="arrow"/></button>
          </aside>
        </div>
      </div>
    </Modal>
  );
}
